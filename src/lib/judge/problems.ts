import { formatValue } from "./compare";
import type { JudgeTestCase } from "./types";

export interface HardcodedProblem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  starterCode: string;
  testCases: JudgeTestCase[];
}

function makeTestCase(
  id: number,
  nums: number[],
  target: number,
  expected: number[],
): JudgeTestCase {
  return {
    id,
    input: `nums = [${nums.join(",")}], target = ${target}`,
    args: [nums, target],
    expected,
    expectedText: formatValue(expected),
  };
}

export const TWO_SUM_STARTER_CODE = `// Two Sum — return indices of the two numbers that add up to target.
function solution(nums, target) {
  // Your code here
  return [];
}
`;

export const TWO_SUM_CORRECT_SOLUTION = `function solution(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}
`;

export const TWO_SUM_PROBLEM: HardcodedProblem = {
  id: "two-sum",
  title: "Two Sum",
  difficulty: "Easy",
  description:
    "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution.",
  starterCode: TWO_SUM_STARTER_CODE,
  testCases: [
    makeTestCase(1, [2, 7, 11, 15], 9, [0, 1]),
    makeTestCase(2, [3, 2, 4], 6, [1, 2]),
    makeTestCase(3, [3, 3], 6, [0, 1]),
    makeTestCase(4, [-1, -2, -3, -4, -5], -8, [2, 4]),
  ],
};

export const PYTHON_MAX_STARTER_CODE = `# Maximum of List — return the largest integer in nums.
def solution(nums):
    # Your code here
    return 0
`;

export const PYTHON_MAX_CORRECT_SOLUTION = `def solution(nums):
    largest = nums[0]
    for n in nums:
        if n > largest:
            largest = n
    return largest
`;

function makeMathTestCase(id: number, nums: number[], expected: number): JudgeTestCase {
  return {
    id,
    input: `nums = [${nums.join(",")}]`,
    args: [nums],
    expected,
    expectedText: formatValue(expected),
  };
}

export const PYTHON_MAX_PROBLEM: HardcodedProblem = {
  id: "max-of-list",
  title: "Maximum of List",
  difficulty: "Easy",
  description:
    "Given a list of integers nums, return the largest value in the list. You may assume the list is never empty. Python runs in-browser via self-hosted Pyodide — fully offline once loaded.",
  starterCode: PYTHON_MAX_STARTER_CODE,
  testCases: [
    makeMathTestCase(1, [3, 1, 2], 3),
    makeMathTestCase(2, [-5, -1, -9], -1),
    makeMathTestCase(3, [7], 7),
    makeMathTestCase(4, [10, 20, 30, 5], 30),
  ],
};
