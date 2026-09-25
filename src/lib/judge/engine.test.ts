// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { judgeJavascript } from "./engine";
import { getActiveWorkerCount, runSingleTestWithWorker } from "./js-worker";
import { TWO_SUM_CORRECT_SOLUTION, TWO_SUM_PROBLEM } from "./problems";
import { runSingleTestWithVm } from "./vm-runner";

const WRONG_SOLUTION = `function solution(nums, target) { return []; }`;
const INFINITE_LOOP = `function solution(nums, target) { while (true) {} }`;
const RUNTIME_ERROR = `function solution(nums, target) { return undefinedVariable + 1; }`;
const SYNTAX_ERROR = `function solution(nums, target) {`;

const vmRunner = { timeoutMs: 800, runner: runSingleTestWithVm } as const;

describe("judgeJavascript (vm runner)", () => {
  it("correct solution passes all tests (100%)", async () => {
    const result = await judgeJavascript(
      TWO_SUM_CORRECT_SOLUTION,
      TWO_SUM_PROBLEM.testCases,
      vmRunner,
    );
    expect(result.total).toBe(4);
    expect(result.passed).toBe(4);
    expect(result.testCases.every((t) => t.status === "Accepted")).toBe(true);
  });

  it("wrong solution fails with Wrong Answer (0%)", async () => {
    const result = await judgeJavascript(
      WRONG_SOLUTION,
      TWO_SUM_PROBLEM.testCases,
      vmRunner,
    );
    expect(result.passed).toBe(0);
    expect(result.testCases.every((t) => t.status === "Wrong Answer")).toBe(true);
  });

  it("infinite loop reports Time Limit Exceeded", async () => {
    const result = await judgeJavascript(
      INFINITE_LOOP,
      TWO_SUM_PROBLEM.testCases.slice(0, 1),
      vmRunner,
    );
    expect(result.passed).toBe(0);
    expect(result.testCases[0].status).toBe("Time Limit Exceeded");
  });

  it("undefined variable reports Runtime Error", async () => {
    const result = await judgeJavascript(
      RUNTIME_ERROR,
      TWO_SUM_PROBLEM.testCases.slice(0, 1),
      vmRunner,
    );
    expect(result.passed).toBe(0);
    expect(result.testCases[0].status).toBe("Runtime Error");
  });

  it("syntax error reports Compile Error", async () => {
    const result = await judgeJavascript(
      SYNTAX_ERROR,
      TWO_SUM_PROBLEM.testCases.slice(0, 1),
      vmRunner,
    );
    expect(result.testCases[0].status).toBe("Compile Error");
  });
});

describe("web worker runner terminates on timeout (no zombies)", () => {
  const RealWorker = globalThis.Worker;
  const RealBlob = globalThis.Blob;
  const RealCreateObjectURL = URL.createObjectURL.bind(URL);
  const RealRevokeObjectURL = URL.revokeObjectURL.bind(URL);

  class NeverRespondingWorker {
    static terminated = 0;
    onmessage: ((event: unknown) => void) | null = null;
    onerror: ((event: unknown) => void) | null = null;
    constructor(public url: string) {}
    postMessage(): void {
      // Never responds — forces the timeout path.
    }
    terminate(): void {
      NeverRespondingWorker.terminated += 1;
    }
  }

  afterEach(() => {
    globalThis.Worker = RealWorker;
    globalThis.Blob = RealBlob;
    URL.createObjectURL = RealCreateObjectURL;
    URL.revokeObjectURL = RealRevokeObjectURL;
    NeverRespondingWorker.terminated = 0;
  });

  it("kills the worker on timeout and leaves zero active workers", async () => {
    globalThis.Worker = NeverRespondingWorker as unknown as typeof Worker;
    const testCase = TWO_SUM_PROBLEM.testCases[0];

    const result = await runSingleTestWithWorker(INFINITE_LOOP, testCase, 100);

    expect(result.status).toBe("Time Limit Exceeded");
    expect(NeverRespondingWorker.terminated).toBe(1);
    expect(getActiveWorkerCount()).toBe(0);
  });

  it("no pile-up across repeated timeouts", async () => {
    globalThis.Worker = NeverRespondingWorker as unknown as typeof Worker;
    const testCase = TWO_SUM_PROBLEM.testCases[0];

    for (let i = 0; i < 3; i++) {
      const result = await runSingleTestWithWorker(INFINITE_LOOP, testCase, 50);
      expect(result.status).toBe("Time Limit Exceeded");
    }

    expect(NeverRespondingWorker.terminated).toBe(3);
    expect(getActiveWorkerCount()).toBe(0);
  });
});
