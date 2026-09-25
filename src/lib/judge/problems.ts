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

export const VALID_PARENTHESES_STARTER_CODE = `// Valid Parentheses — return true if s has matched (), {}, [] pairs.
function solution(s) {
  // Your code here
  return true;
}
`;

export const VALID_PARENTHESES_PROBLEM: HardcodedProblem = {
  id: "valid-parentheses",
  title: "Valid Parentheses",
  difficulty: "Easy",
  description:
    "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if brackets close in the correct order.",
  starterCode: VALID_PARENTHESES_STARTER_CODE,
  testCases: [
    { id: 1, input: 's = "()"', args: ["()"], expected: true, expectedText: "true" },
    { id: 2, input: 's = "()[]{}"', args: ["()[]{}"], expected: true, expectedText: "true" },
    { id: 3, input: 's = "(]"', args: ["(]"], expected: false, expectedText: "false" },
    { id: 4, input: 's = "([)]"', args: ["([)]"], expected: false, expectedText: "false" },
    { id: 5, input: 's = "{[]}"', args: ["{[]}"], expected: true, expectedText: "true" },
    { id: 6, input: 's = ""', args: [""], expected: true, expectedText: "true" },
  ],
};

export const MERGE_INTERVALS_STARTER_CODE = `// Merge Intervals — merge all overlapping intervals, return non-overlapping.
function solution(intervals) {
  // Your code here
  return intervals;
}
`;

export const MERGE_INTERVALS_PROBLEM: HardcodedProblem = {
  id: "merge-intervals",
  title: "Merge Intervals",
  difficulty: "Medium",
  description:
    "Given an array of intervals where intervals[i] = [start, end], merge all overlapping intervals and return the non-overlapping intervals (sorted by start).",
  starterCode: MERGE_INTERVALS_STARTER_CODE,
  testCases: [
    { id: 1, input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]], expectedText: "[[1,6],[8,10],[15,18]]" },
    { id: 2, input: "intervals = [[1,4],[4,5]]", args: [[[1, 4], [4, 5]]], expected: [[1, 5]], expectedText: "[[1,5]]" },
    { id: 3, input: "intervals = [[5,7],[1,3]]", args: [[[5, 7], [1, 3]]], expected: [[1, 3], [5, 7]], expectedText: "[[1,3],[5,7]]" },
    { id: 4, input: "intervals = [[1,4],[2,3]]", args: [[[1, 4], [2, 3]]], expected: [[1, 4]], expectedText: "[[1,4]]" },
    { id: 5, input: "intervals = [[1,1]]", args: [[[1, 1]]], expected: [[1, 1]], expectedText: "[[1,1]]" },
  ],
};

export const LIS_STARTER_CODE = `// Longest Increasing Subsequence — return the length of the longest strictly
// increasing subsequence in nums.
function solution(nums) {
  // Your code here
  return 0;
}
`;

export const LIS_PROBLEM: HardcodedProblem = {
  id: "longest-increasing-subsequence",
  title: "Longest Increasing Subsequence",
  difficulty: "Medium",
  description:
    "Given an integer array nums, return the length of the longest strictly increasing subsequence.",
  starterCode: LIS_STARTER_CODE,
  testCases: [
    { id: 1, input: "nums = [10,9,2,5,3,7,101,18]", args: [[10, 9, 2, 5, 3, 7, 101, 18]], expected: 4, expectedText: "4" },
    { id: 2, input: "nums = [0,1,0,3,2,3]", args: [[0, 1, 0, 3, 2, 3]], expected: 4, expectedText: "4" },
    { id: 3, input: "nums = [7,7,7,7,7,7,7]", args: [[7, 7, 7, 7, 7, 7, 7]], expected: 1, expectedText: "1" },
    { id: 4, input: "nums = [1,2,3,4,5]", args: [[1, 2, 3, 4, 5]], expected: 5, expectedText: "5" },
    { id: 5, input: "nums = [5,4,3,2,1]", args: [[5, 4, 3, 2, 1]], expected: 1, expectedText: "1" },
  ],
};

export const WORD_LADDER_STARTER_CODE = `// Word Ladder — shortest transformation from beginWord to endWord, one letter
// change per step, every intermediate word in wordList. Return 0 if impossible.
function solution(beginWord, endWord, wordList) {
  // Your code here
  return 0;
}
`;

export const WORD_LADDER_PROBLEM: HardcodedProblem = {
  id: "word-ladder",
  title: "Word Ladder",
  difficulty: "Hard",
  description:
    "Given beginWord, endWord and a dictionary wordList, return the length of the shortest transformation sequence from beginWord to endWord, such that only one letter is changed at each step and each transformed word must exist in wordList. Return 0 if no such sequence exists.",
  starterCode: WORD_LADDER_STARTER_CODE,
  testCases: [
    { id: 1, input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]', args: ["hit", "cog", ["hot", "dot", "dog", "lot", "log", "cog"]], expected: 5, expectedText: "5" },
    { id: 2, input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]', args: ["hit", "cog", ["hot", "dot", "dog", "lot", "log"]], expected: 0, expectedText: "0" },
    { id: 3, input: 'beginWord = "hot", endWord = "dog", wordList = ["hot","dot","dog"]', args: ["hot", "dog", ["hot", "dot", "dog"]], expected: 3, expectedText: "3" },
    { id: 4, input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","cog"]', args: ["hit", "cog", ["hot", "cog"]], expected: 2, expectedText: "2" },
  ],
};

export const MEDIAN_STARTER_CODE = `// Median of Two Sorted Arrays — return the median of the combined sorted arrays.
function solution(nums1, nums2) {
  // Your code here
  return 0;
}
`;

export const MEDIAN_PROBLEM: HardcodedProblem = {
  id: "median-of-two-sorted-arrays",
  title: "Median of Two Sorted Arrays",
  difficulty: "Hard",
  description:
    "Given two sorted arrays nums1 and nums2, return the median of the two sorted arrays combined. The overall run time complexity should be O(log(m + n)).",
  starterCode: MEDIAN_STARTER_CODE,
  testCases: [
    { id: 1, input: "nums1 = [1,3], nums2 = [2]", args: [[1, 3], [2]], expected: 2, expectedText: "2" },
    { id: 2, input: "nums1 = [1,2], nums2 = [3,4]", args: [[1, 2], [3, 4]], expected: 2.5, expectedText: "2.5" },
    { id: 3, input: "nums1 = [], nums2 = [1]", args: [[], [1]], expected: 1, expectedText: "1" },
    { id: 4, input: "nums1 = [0,0], nums2 = [0,0]", args: [[0, 0], [0, 0]], expected: 0, expectedText: "0" },
    { id: 5, input: "nums1 = [2], nums2 = []", args: [[2], []], expected: 2, expectedText: "2" },
  ],
};

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
