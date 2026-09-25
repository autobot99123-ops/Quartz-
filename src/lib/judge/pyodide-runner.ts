import { mapPythonTestResult } from "./py-runner-core";
import type { JudgeTestCase, JudgeTestResult } from "./types";

/**
 * The Python judge runs in a real same-origin classic worker served from
 * /pyodide-worker.js (public/, self-hosted Pyodide, NO CDN). A real file is
 * used because modern Chromium rejects classic workers constructed from Blob
 * URLs. An infinite user loop blocks the worker — the main thread terminates
 * it (killed on timeout).
 */

/** Live Python workers. Kept so we can prove no zombies pile up. */
const activePyWorkers = new Set<Worker>();

export function getPyActiveWorkerCount(): number {
  return activePyWorkers.size;
}

// Production-exposed handle so worker leaks are observable anywhere
// (window.__quartzJudge.getPyActiveWorkerCount(), merged across modules).
if (typeof window !== "undefined") {
  const scope = window as unknown as {
    __quartzJudge?: Record<string, () => number>;
  };
  scope.__quartzJudge = {
    ...scope.__quartzJudge,
    getPyActiveWorkerCount,
  };
}

export interface PyodideWorkerHandle {
  alive: boolean;
  destroyed: boolean;
}

type OnMessage = (event: MessageEvent) => void;
type OnError = (event: ErrorEvent | unknown) => void;

interface WorkerLike {
  onmessage: OnMessage | null;
  onerror: OnError | null;
  postMessage: (msg: unknown) => void;
  terminate: () => void;
}

type WorkerFactory = () => WorkerLike;

const browserWorkerFactory: WorkerFactory = () => {
  const worker = new Worker("/pyodide-worker.js", { type: "module" });
  activePyWorkers.add(worker);
  const listeners: { onMsg: OnMessage | null; onErr: OnError | null } = {
    onMsg: null,
    onErr: null,
  };
  worker.onmessage = (event: MessageEvent) => {
    if (listeners.onMsg) listeners.onMsg(event);
  };
  worker.onerror = (event: ErrorEvent) => {
    if (listeners.onErr) listeners.onErr(event);
  };
  return {
    get onmessage() {
      return listeners.onMsg;
    },
    set onmessage(fn: OnMessage | null) {
      listeners.onMsg = fn;
    },
    get onerror() {
      return listeners.onErr;
    },
    set onerror(fn: OnError | null) {
      listeners.onErr = fn;
    },
    postMessage: (msg: unknown) => worker.postMessage(msg),
    terminate: () => {
      activePyWorkers.delete(worker);
      worker.terminate();
    },
  };
};

/**
 * Persistent single Pyodide worker. Reused across runs so the ~2-4s
 * WASM+stdlib init happens once per page session. On timeout the worker is
 * TERMINATED (killing the hung interpreter) and recreated on next use —
 * a hung Python loop can only be broken by termination.
 */
export function createPyodideRunner(factory: WorkerFactory = browserWorkerFactory) {
  let worker: WorkerLike | null = null;
  let readyPromise: Promise<void> | null = null;

  const ensureWorker = (): Promise<WorkerLike> => {
    if (worker && readyPromise) {
      return readyPromise.then(() => worker as WorkerLike);
    }
    return spawn();
  };

  const spawn = (): Promise<WorkerLike> => {
    const w = factory();
    worker = w;
    readyPromise = new Promise<void>((resolve, reject) => {
      w.onmessage = (event) => {
        const data = (event.data ?? {}) as { type?: string; error?: string };
        if (data.type === "ready") {
          w.onmessage = route; // hand future messages to the routing handler
          resolve();
        } else if (data.type === "init-error") {
          reject(new Error(data.error ?? "Pyodide init failed"));
          dispose();
        }
      };
      w.onerror = () => reject(new Error("Pyodide worker crashed during init"));
    });
    return readyPromise.then(() => w);
  };

  const route: OnMessage = (event) => {
    const data = event.data as { __runId?: number; type?: string } | undefined;
    let id: number | undefined;
    if (data && data.__runId !== undefined) {
      id = data.__runId;
    } else if (data && data.type === "result" && pending.size === 1) {
      // Single-flight fallback: the classic/JS worker may not echo __runId.
      id = pending.keys().next().value as number;
    }
    if (id === undefined) return;
    const handler = pending.get(id);
    if (handler) {
      pending.delete(id);
      handler(event);
    }
  };

  let runIdCounter = 0;
  const pending = new Map<number, (event: MessageEvent) => void>();

  const run = (
    code: string,
    args: unknown[],
  ): Promise<
    { ok: true; value: unknown } | { ok: false; errorType: string; error?: string }
  > => {
    return new Promise((resolve, reject) => {
      ensureWorker().then((w) => {
        const id = ++runIdCounter;
        pending.set(id, (event) => {
          const data = event.data as {
            ok?: boolean;
            value?: unknown;
            errorType?: string;
            error?: string;
          };
          if (data.ok) resolve({ ok: true, value: data.value });
          else
            resolve({
              ok: false,
              errorType: data.errorType ?? "runtime",
              error: data.error,
            });
        });
        w.postMessage({ __runId: id, type: "run", code, args });
      }).catch(reject);
    });
  };

  const dispose = () => {
    if (worker) {
      worker.terminate();
      worker = null;
    }
    readyPromise = null;
  };

  /** Spawns the worker if needed and resolves once it is initialized
   *  (no-op if already warm). Lets callers exclude Pyodide's ~2-4s
   *  WASM+stdlib init from the per-test timeout. */
  const waitReady = () => (readyPromise ? readyPromise : spawn());

  return { run, dispose, waitReady };
}

export type PyodideRunner = ReturnType<typeof createPyodideRunner>;

/** Run one Python test case (Warm worker, terminated on timeout). */
export function runPythonTestWithWorker(
  runner: PyodideRunner,
  code: string,
  testCase: JudgeTestCase,
  timeoutMs = 2000,
): Promise<JudgeTestResult> {
  const started = Date.now();
  const build = (
    output: string,
    status: JudgeTestResult["status"],
  ): JudgeTestResult => ({
    id: testCase.id,
    input: testCase.input,
    expected: testCase.expectedText,
    output,
    status,
    timeMs: Date.now() - started,
  });

  return new Promise<JudgeTestResult>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      runner.dispose(); // terminates the worker — kills the hung interpreter
      resolve(build(`Time Limit Exceeded (${timeoutMs}ms)`, "Time Limit Exceeded"));
    }, timeoutMs);

    runner
      .run(code, testCase.args)
      .then((response) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        const mapped = mapPythonTestResult(
          response.ok
            ? { ok: true as const, value: response.value }
            : {
                ok: false as const,
                errorType: response.errorType as "syntax" | "runtime" | "nofn",
                error: response.error,
              },
          testCase,
          started,
        );
        resolve(mapped);
      })
      .catch((err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(build(err instanceof Error ? err.message : String(err), "Runtime Error"));
      });
  });
}