export type Verdict =
  | "Accepted"
  | "Wrong Answer"
  | "Time Limit Exceeded"
  | "Runtime Error"
  | "Compile Error";

export interface JudgeTestCase {
  id: number;
  /** Human-readable input, e.g. "nums = [2,7,11,15], target = 9" */
  input: string;
  /** Arguments passed to solution(nums, target) */
  args: unknown[];
  /** Expected return value */
  expected: unknown;
  /** Human-readable expected value, e.g. "[0,1]" */
  expectedText: string;
}

export interface JudgeTestResult {
  id: number;
  input: string;
  expected: string;
  output: string;
  status: Verdict;
  timeMs: number;
  /** Captured stdout/stderr from the user's code ('' when silent). */
  stdout?: string;
}

export interface JudgeResult {
  passed: number;
  total: number;
  /** Wall-clock ms for the whole submission */
  time: number;
  /** Memory KB (0 — not measurable in a Web Worker) */
  memory: number;
  testCases: JudgeTestResult[];
}
