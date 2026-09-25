/**
 * Node-only runner (Vitest). Mirrors the Web Worker logic using `node:vm`
 * with the `timeout` option so infinite loops throw instead of hanging.
 *
 * NEVER imported by client components — the browser uses js-worker.ts.
 */
import vm from "node:vm";
import { formatValue, outputsEqual } from "./compare";
import type { JudgeTestCase, JudgeTestResult } from "./types";

interface VmResultBox {
  __noFn?: boolean;
  __value?: unknown;
}

function isThenable(value: unknown): boolean {
  if (typeof value !== "object" && typeof value !== "function") return false;
  if (value === null) return false;
  const then = (value as { then?: unknown }).then;
  return typeof then === "function";
}

export async function runSingleTestWithVm(
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

  try {
    const context = vm.createContext({
      __args__: testCase.args,
      __box__: undefined as unknown,
    });
    const source = `${code}
;__box__ = (() => {
  const fn = (typeof solution !== "undefined" ? solution : (typeof twoSum !== "undefined" ? twoSum : undefined));
  if (typeof fn !== "function") return { __noFn: true };
  return { __value: fn(...__args__) };
})();`;
    vm.runInContext(source, context, { timeout: timeoutMs });
    const box = (context as unknown as { __box__: VmResultBox }).__box__;
    if (!box || box.__noFn) {
      return build("No solution(nums, target) function found", "Runtime Error");
    }
    if (isThenable(box.__value)) {
      return build("Async solutions are not supported", "Runtime Error");
    }
    const pass = outputsEqual(box.__value, testCase.expected);
    return build(formatValue(box.__value), pass ? "Accepted" : "Wrong Answer");
  } catch (err) {
    // NOTE: instanceof fails across the vm realm boundary — duck-type instead.
    const props = err as { message?: unknown; name?: unknown } | null;
    const message =
      typeof props?.message === "string" ? props.message : String(err);
    const name = typeof props?.name === "string" ? props.name : "";
    if (message.includes("Script execution timed out")) {
      return build(`Time Limit Exceeded (${timeoutMs}ms)`, "Time Limit Exceeded");
    }
    if (name === "SyntaxError") {
      return build(message, "Compile Error");
    }
    return build(message, "Runtime Error");
  }
}
