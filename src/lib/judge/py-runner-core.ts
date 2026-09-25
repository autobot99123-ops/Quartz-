import { formatValue, outputsEqual } from "./compare";
import type { JudgeTestCase, JudgeTestResult } from "./types";

export type PythonRuntime = {
  runPython: (
    code: string,
    options?: { globals: unknown },
  ) => unknown;
  globals: {
    set: (name: string, value: unknown) => void;
    get: (name: string) => unknown;
  };
  toPy: (value: unknown) => unknown & { set?: (k: string, v: unknown) => void; destroy?: () => void };
};

export interface PythonRunOk {
  ok: true;
  value: unknown;
}

export interface PythonRunErr {
  ok: false;
  errorType: "syntax" | "runtime" | "nofn";
  error?: string;
}

export type PythonRunResponse = PythonRunOk | PythonRunErr;

/** Fresh global scope — a `solution` defined by one run must never bleed
 *  into the next test/submission. */
export function newScope(runtime: PythonRuntime): ReturnType<PythonRuntime["toPy"]> {
  return runtime.toPy({});
}

/** Pyodide wraps ALL Python exceptions as `PythonError`; distinguish a
 *  syntax error by its traceback text. */
export function pyErrorType(err: unknown): { type: "syntax" | "runtime"; message: string } {
  const e = err as { name?: unknown; message?: unknown } | null;
  const name = typeof e?.name === "string" ? e.name : "";
  const message = typeof e?.message === "string" ? e.message : String(err);
  if (name === "SyntaxError" || /SyntaxError:/.test(message)) {
    return { type: "syntax", message };
  }
  return { type: "runtime", message };
}

/** Serializer printed into the worker glue so arbitrary return values
 *  round-trip through JSON (lists, dicts, tuples, numbers, strings). */
export const PY_SERIALIZE_GLUE = `
import json

def __quartz_default__(o):
    try:
        return str(o)
    except Exception:
        return "<unserializable>"

def __quartz_serialize__(result):
    return json.dumps(result, default=__quartz_default__)
`;

/**
 * Core Python execution against a live Pyodide runtime, in a FRESH global
 * scope per call. Mirrors the browser-worker semantics (syntax -> Compile
 * Error, runtime -> Runtime Error). An infinite loop blocks the caller
 * thread — the orchestrator terminates the worker on timeout.
 */
export function runPythonWithRuntime(
  runtime: PythonRuntime,
  code: string,
  args: unknown[],
): PythonRunResponse {
  const scope = newScope(runtime);
  const destroy = () => {
    try {
      scope.destroy?.();
    } catch {
      // destroy() is best-effort for PyProxy scopes.
    }
  };

  try {
    runtime.runPython(code, { globals: scope });
  } catch (err) {
    const info = pyErrorType(err);
    destroy();
    return { ok: false, errorType: info.type, error: info.message };
  }

  try {
    const hasFn = runtime.runPython("'solution' in globals()", { globals: scope });
    if (!hasFn) {
      destroy();
      return { ok: false, errorType: "nofn" };
    }
    scope.set?.("__args__", runtime.toPy(args));
    runtime.runPython(PY_SERIALIZE_GLUE, { globals: scope });
    const jsonStr = runtime.runPython(
      "__quartz_serialize__(solution(*__args__))",
      { globals: scope },
    );
    const value = JSON.parse(String(jsonStr));
    destroy();
    return { ok: true, value };
  } catch (err) {
    const info = pyErrorType(err);
    destroy();
    return { ok: false, errorType: "runtime", error: info.message };
  }
}

/** Test-case level verdict (used by the browser worker + Node tests). */
export function mapPythonTestResult(
  response: PythonRunResponse,
  testCase: JudgeTestCase,
  started: number,
): JudgeTestResult {
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

  if (response.ok) {
    const pass = outputsEqual(response.value, testCase.expected);
    return build(
      formatValue(response.value),
      pass ? "Accepted" : "Wrong Answer",
    );
  }
  if (response.errorType === "syntax") {
    return build(response.error ?? "SyntaxError", "Compile Error");
  }
  if (response.errorType === "nofn") {
    return build("No solution(nums, target) function found", "Runtime Error");
  }
  return build(response.error ?? "Runtime error", "Runtime Error");
}