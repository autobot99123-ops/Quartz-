import { runSingleTestWithWorker } from "./js-worker";
import {
  createPyodideRunner,
  runPythonTestWithWorker,
} from "./pyodide-runner";
import type { JudgeResult, JudgeTestCase, JudgeTestResult } from "./types";

export type SingleTestRunner = (
  code: string,
  testCase: JudgeTestCase,
  timeoutMs: number,
) => Promise<JudgeTestResult>;

export interface JudgeOptions {
  /** Per-test timeout in ms. Default 2000. */
  timeoutMs?: number;
  /** Defaults to the Web Worker runner. Tests inject the vm runner. */
  runner?: SingleTestRunner;
}

/** Persistent Pyodide worker shared across submissions in a page session.
 *  First Python run pays the ~2-4s WASM init; later runs reuse it. */
let pyodideRunnerSingleton: ReturnType<typeof createPyodideRunner> | null =
  null;

function getPyodideRunner() {
  if (!pyodideRunnerSingleton) {
    pyodideRunnerSingleton = createPyodideRunner();
  }
  return pyodideRunnerSingleton;
}

const defaultPythonRunner: SingleTestRunner = (code, testCase, timeoutMs) =>
  runPythonTestWithWorker(getPyodideRunner(), code, testCase, timeoutMs);

/** Run user JS against every test case. One isolated worker per test,
 *  all in parallel (order preserved) so a full-timeout submission
 *  resolves in ~1x timeout instead of Nx. */
export async function judgeJavascript(
  code: string,
  testCases: JudgeTestCase[],
  options: JudgeOptions = {},
): Promise<JudgeResult> {
  const timeoutMs = options.timeoutMs ?? 2000;
  const runner = options.runner ?? runSingleTestWithWorker;
  const started = Date.now();

  const results = await Promise.all(
    testCases.map((testCase) => runner(code, testCase, timeoutMs)),
  );

  const passed = results.filter((r) => r.status === "Accepted").length;
  return {
    passed,
    total: results.length,
    time: Date.now() - started,
    memory: 0,
    testCases: results,
  };
}

/** Run user Python through a single warm Pyodide worker (sequential —
 *  a Python interpreter can only execute one call at a time). Same
 *  verdict set as the JS judge. */
export async function judgePython(
  code: string,
  testCases: JudgeTestCase[],
  options: JudgeOptions = {},
): Promise<JudgeResult> {
  const timeoutMs = options.timeoutMs ?? 2000;
  const runner = options.runner ?? defaultPythonRunner;
  const started = Date.now();

  // Warm the shared Pyodide worker BEFORE any per-test timer starts, so the
  // one-time WASM+stdlib init (~2-4s) isn't counted against the first test.
  if (!options.runner) {
    await getPyodideRunner().waitReady();
  }

  const results: JudgeTestResult[] = [];
  for (const testCase of testCases) {
    results.push(await runner(code, testCase, timeoutMs));
  }

  const passed = results.filter((r) => r.status === "Accepted").length;
  return {
    passed,
    total: results.length,
    time: Date.now() - started,
    memory: 0,
    testCases: results,
  };
}
