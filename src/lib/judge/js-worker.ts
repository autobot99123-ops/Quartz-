import { formatValue, outputsEqual } from "./compare";
import type { JudgeTestCase, JudgeTestResult } from "./types";

/**
 * Worker body. Runs user code, calls solution(...args) (or twoSum fallback),
 * and posts back { ok, value } or { ok: false, errorType, error }.
 * An infinite loop blocks the worker — the main thread kills it via timeout.
 */
export const JS_WORKER_SRC = `
var __outLines = [];
function __fmt(v) {
  if (typeof v === "string") return v;
  try { var j = JSON.stringify(v); return typeof j === "string" ? j : String(v); } catch (e) { return String(v); }
}
(function () {
  console.log = function () { for (var i = 0; i < arguments.length; i++) __outLines.push(__fmt(arguments[i])); };
  console.warn = function () { for (var i = 0; i < arguments.length; i++) __outLines.push(__fmt(arguments[i])); };
  console.error = function () { for (var i = 0; i < arguments.length; i++) __outLines.push(__fmt(arguments[i])); };
})();
self.onmessage = function (e) {
  var data = e.data || {};
  var code = data.code;
  var args = data.args;
  var stdout = __outLines.join("\\n");
  try {
    var factory = new Function(
      code + "\\n;return (typeof solution !== 'undefined' ? solution : (typeof twoSum !== 'undefined' ? twoSum : undefined));"
    );
    var fn = factory();
    if (typeof fn !== "function") {
      self.postMessage({ ok: false, errorType: "nofn", stdout: stdout });
      return;
    }
    var value = fn.apply(null, args);
    if (value && typeof value.then === "function") {
      self.postMessage({ ok: false, errorType: "async", stdout: stdout });
      return;
    }
    self.postMessage({ ok: true, value: value, stdout: __outLines.join("\\n") });
  } catch (err) {
    var message = err && err.message ? err.message : String(err);
    var isSyntax = err && err.name === "SyntaxError";
    self.postMessage({ ok: false, errorType: isSyntax ? "syntax" : "runtime", error: message, stdout: __outLines.join("\\n") });
  }
};
`;

/** Live workers — used to prove no zombies pile up after timeouts. */
const activeWorkers = new Set<Worker>();

export function getActiveWorkerCount(): number {
  return activeWorkers.size;
}

// Production-exposed handle so worker leaks are observable anywhere
// (window.__quartzJudge.getActiveWorkerCount(), merged across modules).
if (typeof window !== "undefined") {
  const scope = window as unknown as {
    __quartzJudge?: Record<string, () => number>;
  };
  scope.__quartzJudge = {
    ...scope.__quartzJudge,
    getActiveWorkerCount,
  };
}

interface WorkerResponse {
  ok: boolean;
  value?: unknown;
  errorType?: string;
  error?: string;
  stdout?: string;
}

/**
 * Run ONE test case in a fresh Worker. The worker is ALWAYS terminated —
 * on success, on error, and on timeout — so repeated timeouts can't leak.
 */
export function runSingleTestWithWorker(
  code: string,
  testCase: JudgeTestCase,
  timeoutMs = 2000,
): Promise<JudgeTestResult> {
  const started = Date.now();
  const build = (
    output: string,
    status: JudgeTestResult["status"],
    stdout?: string,
  ): JudgeTestResult => ({
    id: testCase.id,
    input: testCase.input,
    expected: testCase.expectedText,
    output,
    status,
    timeMs: Date.now() - started,
    stdout,
  });

  return new Promise<JudgeTestResult>((resolve) => {
    let settled = false;
    let worker: Worker | null = null;
    let objectUrl: string | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      if (worker !== null) {
        activeWorkers.delete(worker);
        try {
          worker.terminate();
        } catch {
          // terminate() is best-effort; the worker is already dropped.
        }
        worker = null;
      }
      if (objectUrl !== null) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // revocation is best-effort.
        }
        objectUrl = null;
      }
    };

    const settle = (result: JudgeTestResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    try {
      if (typeof Worker === "undefined") {
        settle(
          build("Web Workers are unavailable in this environment", "Runtime Error"),
        );
        return;
      }
      const blob = new Blob([JS_WORKER_SRC], { type: "application/javascript" });
      objectUrl = URL.createObjectURL(blob);
      worker = new Worker(objectUrl, { type: "module" });
      activeWorkers.add(worker);

      timer = setTimeout(() => {
        settle(build(`Time Limit Exceeded (${timeoutMs}ms)`, "Time Limit Exceeded"));
      }, timeoutMs);

      worker.onmessage = (event: MessageEvent) => {
        const data = event.data as WorkerResponse;
        if (data.ok) {
          const pass = outputsEqual(data.value, testCase.expected);
          settle(build(formatValue(data.value), pass ? "Accepted" : "Wrong Answer", data.stdout));
        } else if (data.errorType === "syntax") {
          settle(build(data.error ?? "SyntaxError", "Compile Error", data.stdout));
        } else if (data.errorType === "nofn") {
          settle(build("No solution(nums, target) function found", "Runtime Error", data.stdout));
        } else if (data.errorType === "async") {
          settle(build("Async solutions are not supported", "Runtime Error", data.stdout));
        } else {
          settle(build(data.error ?? "Runtime error", "Runtime Error", data.stdout));
        }
      };

      worker.onerror = (event: ErrorEvent) => {
        settle(build(event.message || "Worker error", "Runtime Error"));
      };

      worker.postMessage({ code, args: testCase.args });
    } catch (err) {
      settle(build(err instanceof Error ? err.message : String(err), "Runtime Error"));
    }
  });
}
