import { createRequire } from "node:module";
import path from "node:path";
import { loadPyodide } from "pyodide";
import type { SingleTestRunner } from "./engine";
import { mapPythonTestResult, runPythonWithRuntime } from "./py-runner-core";
import type { PythonRuntime } from "./py-runner-core";

let cached: Promise<SingleTestRunner> | null = null;

/** Locate the local pyodide package dir (Vite re-points import.meta.url
 *  inside tests, so we resolve from the filesystem instead). */
export function nodePyodideDir(): string {
  const req = createRequire(import.meta.url);
  return path.dirname(req.resolve("pyodide/package.json"));
}

/** Load a real Pyodide runtime in Node from the local package dir. */
export async function loadNodePyodide(): Promise<PythonRuntime> {
  return (await loadPyodide({ indexURL: nodePyodideDir() + path.sep })) as unknown as PythonRuntime;
}

/**
 * Lazily loads ONE Pyodide instance (Node) and returns a judge runner that
 * reuses it — mirrors the browser's warm-worker strategy.
 */
export function invokeOnce(): Promise<SingleTestRunner> {
  if (!cached) {
    cached = (async () => {
      const runtime = await loadNodePyodide();
      const runner: SingleTestRunner = async (code, testCase, _timeoutMs) => {
        void _timeoutMs; // timeout not enforced in Node; mirrors engine behavior
        const started = Date.now();
        const response = runPythonWithRuntime(runtime, code, testCase.args);
        return mapPythonTestResult(response, testCase, started);
      };
      return runner;
    })();
  }
  return cached;
}