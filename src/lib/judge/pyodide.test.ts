// @vitest-environment node
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { loadNodePyodide, invokeOnce } from "./pyodide-test";
import { judgePython } from "./engine";
import { PYTHON_MAX_CORRECT_SOLUTION, PYTHON_MAX_PROBLEM } from "./problems";
import { createPyodideRunner, runPythonTestWithWorker } from "./pyodide-runner";
import { runPythonWithRuntime } from "./py-runner-core";
import type { PythonRuntime } from "./py-runner-core";

const WRONG = `def solution(nums):
    return 0
`;
const RUNTIME_ERROR = `def solution(nums):
    return undefined_variable + 1
`;
const SYNTAX_ERROR = `def solution(nums):
    return

    def broken(
`;

describe("runPythonWithRuntime (real Pyodide in Node)", () => {
  let runtime: PythonRuntime;

  beforeAll(async () => {
    runtime = await loadNodePyodide();
  });

  it("correct solution passes", async () => {
    const res = runPythonWithRuntime(runtime, PYTHON_MAX_CORRECT_SOLUTION, [[3, 1, 2]]);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toBe(3);
  });

  it("wrong solution returns wrong value (Wrong Answer path)", async () => {
    const res = runPythonWithRuntime(runtime, WRONG, [[3, 1, 2]]);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toBe(0);
  });

  it("missing function -> nofn", async () => {
    const res = runPythonWithRuntime(runtime, "x = 1\n", [[1]]);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorType).toBe("nofn");
  });

  it("runtime error -> runtime", async () => {
    const res = runPythonWithRuntime(runtime, RUNTIME_ERROR, [[1]]);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errorType).toBe("runtime");
      expect(res.error).toContain("undefined_variable");
    }
  });

  it("syntax error -> syntax", async () => {
    const res = runPythonWithRuntime(runtime, SYNTAX_ERROR, [[1]]);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorType).toBe("syntax");
  });

  it("list comprehension return value round-trips through JSON", async () => {
    const code = `def solution(nums):
    return [n * 2 for n in nums]
`;
    const res = runPythonWithRuntime(runtime, code, [[1, 2, 3]]);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toEqual([2, 4, 6]);
  });
});

describe("judgePython (real Pyodide in Node)", () => {
  let pythonRunner: Awaited<ReturnType<typeof invokeOnce>>;

  beforeAll(async () => {
    pythonRunner = await invokeOnce();
  });

  it("solves the hardcoded Python problem (100%)", async () => {
    const result = await judgePython(
      PYTHON_MAX_CORRECT_SOLUTION,
      PYTHON_MAX_PROBLEM.testCases,
      { timeoutMs: 2000, runner: pythonRunner },
    );
    expect(result.total).toBe(4);
    expect(result.passed).toBe(4);
    expect(result.testCases.every((t) => t.status === "Accepted")).toBe(true);
  });

  it("wrong Python solution -> Wrong Answer (0%)", async () => {
    const result = await judgePython(WRONG, PYTHON_MAX_PROBLEM.testCases, {
      timeoutMs: 2000,
      runner: pythonRunner,
    });
    expect(result.passed).toBe(0);
    expect(
      result.testCases.every((t) => t.status === "Wrong Answer"),
    ).toBe(true);
  });

  it("Python runtime error -> Runtime Error", async () => {
    const result = await judgePython(
      RUNTIME_ERROR,
      PYTHON_MAX_PROBLEM.testCases.slice(0, 1),
      { timeoutMs: 2000, runner: pythonRunner },
    );
    expect(result.testCases[0].status).toBe("Runtime Error");
  });
});

describe("python worker terminates on timeout (no zombies)", () => {
  const RealWorker = globalThis.Worker;
  const RealBlob = globalThis.Blob;
  const RealCreateObjectURL = URL.createObjectURL.bind(URL);
  const RealRevokeObjectURL = URL.revokeObjectURL.bind(URL);

  afterEach(() => {
    globalThis.Worker = RealWorker;
    globalThis.Blob = RealBlob;
    URL.createObjectURL = RealCreateObjectURL;
    URL.revokeObjectURL = RealRevokeObjectURL;
  });

  function makeRunner(factory: () => {
    onmessage: null;
    onerror: null;
    postMessage: () => void;
    terminate: () => void;
  }) {
    return createPyodideRunner(factory);
  }

  it("kills the (hung) pyodide worker on timeout", async () => {
    let terminated = 0;
    const runner = makeRunner(() => ({
      onmessage: null,
      onerror: null,
      postMessage: () => {},
      terminate: () => {
        terminated += 1;
      },
    }));
    const result = await runPythonTestWithWorker(
      runner,
      "def solution(): pass",
      PYTHON_MAX_PROBLEM.testCases[0],
      100,
    );
    expect(result.status).toBe("Time Limit Exceeded");
    expect(terminated).toBe(1);
  });

  it("spawns a fresh worker after a timeout (no pile-up)", async () => {
    let creations = 0;
    let terminated = 0;
    const runner = makeRunner(() => {
      creations += 1;
      return {
        onmessage: null,
        onerror: null,
        postMessage: () => {},
        terminate: () => {
          terminated += 1;
        },
      };
    });
    for (let i = 0; i < 3; i++) {
      await runPythonTestWithWorker(
        runner,
        "def solution(): pass",
        PYTHON_MAX_PROBLEM.testCases[0],
        80,
      );
    }
    expect(creations).toBe(3);
    expect(terminated).toBe(3);
  });
});