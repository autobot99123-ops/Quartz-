/* eslint-disable @typescript-eslint/no-require-imports */
/* Seed the committed problem catalog (public/catalog):
 *   index.json            — [{ id, title, pattern, difficulty, live }] (small)
 *   problems/<id>.json    — full content per the confirmed schema.
 * Only SEED problems are (re)written here; admin-published problem files that
 * already exist in public/catalog/problems are preserved, and their index
 * entries are carried over so a rebuild never wipes committed work.
 * Run BEFORE `next build` so public/ is exported into out/. */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CATALOG_DIR = path.join(ROOT, "public", "catalog");
const PROBLEMS_DIR = path.join(CATALOG_DIR, "problems");

function tests(list) {
  return list.map(([input, out]) => ({ in: input, out, hidden: false }));
}

function examples(title, params) {
  return tests(params)
    .slice(0, 2)
    .map(
      (t, i) =>
        `**Example ${i + 1}:**\n\`\`\`\n${title}(${t.in
          .map((v) => JSON.stringify(v))
          .join(", ")}) -> ${JSON.stringify(t.out)}\n\`\`\``,
    )
    .join("\n\n");
}

/* id -> full seed definition. `pattern` is one category among the
 * patterns students can filter on; `hints` are nudge/concept/pseudocode. */
const SEED = [
  {
    id: "two-sum",
    title: "Two Sum",
    pattern: "Hash Map",
    difficulty: "easy",
    statement: "Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target. You may assume that each input has exactly one solution, and you may not use the same element twice.",
    concept:
      "Trade time for space: hash each visited value against its index as you iterate, so the complement lookup is O(1). Recognise it whenever an O(n²) pair search can be answered by map lookups.",
    starterJs: "// Two Sum — return indices of the two numbers that add up to target.\nfunction solution(nums, target) {\n  // Your code here\n  return [];\n}\n",
    refJs:
      "function solution(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const need = target - nums[i];\n    if (seen.has(need)) return [seen.get(need), i];\n    seen.set(nums[i], i);\n  }\n  return [];\n}\n",
    params: [
      [[2, 7, 11, 15], 9],
      [[3, 2, 4], 6],
      [[3, 3], 6],
      [[-1, -2, -3, -4, -5], -8],
      [[0, 4, 3, 0], 0],
    ],
    hints: [
      "You don't need to compare every pair — the value you're searching for is target minus the current number.",
      "Store each value → index in a hash map as you iterate; look up the complement in O(1) instead of scanning the array.",
      "seen = {}; for i,n in nums: need = target - n; if need in seen return [seen[need], i]; seen[n] = i",
    ],
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    pattern: "Stacks",
    difficulty: "easy",
    statement: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if every open bracket is closed by the same type of bracket, in the correct order.",
    concept:
      "The LIFO nature of matched bracket pairs is exactly a stack. Push openers, pop on closers, and verify the top matches. Recognise it whenever nested or mirrored elements must pair up in order.",
    starterJs: "// Valid Parentheses — return true if s has matched (), {}, [] pairs.\nfunction solution(s) {\n  // Your code here\n  return true;\n}\n",
    refJs:
      "function solution(s) {\n  const stack = [];\n  const pairs = { ')': '(', '}': '{', ']': '[' };\n  for (const ch of s) {\n    if (ch === '(' || ch === '{' || ch === '[') stack.push(ch);\n    else if (stack.pop() !== pairs[ch]) return false;\n  }\n  return stack.length === 0;\n}\n",
    params: [
      [["()"], true],
      [["()[]{}"], true],
      [["(]"], false],
      [["([)]"], false],
      [["{[]}"], true],
      [[""], true],
    ],
    hints: [
      "A closing bracket must pair with the most recent unclosed opener — that is a stack, not a queue.",
      "Push every opener, pop when you read a closer, and the popped symbol must match the closer's expected opener.",
      "stack = []; for ch in s: if ch in '({[' push; else if pop() != pair[ch] return false; return stack empty",
    ],
  },
  {
    id: "merge-intervals",
    title: "Merge Intervals",
    pattern: "Intervals",
    difficulty: "medium",
    statement: "Given an array of intervals where intervals[i] = [start, end], merge all overlapping intervals and return an array of the non-overlapping intervals, sorted by start.",
    concept:
      "Sort by start, then greedily merge when the next interval's start is within the current end. Recognise it when a result only depends on adjacent overlap after ordering.",
    starterJs: "// Merge Intervals — merge all overlapping intervals, return non-overlapping.\nfunction solution(intervals) {\n  // Your code here\n  return intervals;\n}\n",
    refJs:
      "function solution(intervals) {\n  intervals.sort((a, b) => a[0] - b[0]);\n  const out = [];\n  for (const [s, e] of intervals) {\n    const last = out[out.length - 1];\n    if (last && s <= last[1]) last[1] = Math.max(last[1], e);\n    else out.push([s, e]);\n  }\n  return out;\n}\n",
    params: [
      [[[1, 3], [2, 6], [8, 10], [15, 18]], [[1, 6], [8, 10], [15, 18]]],
      [[[1, 4], [4, 5]], [[1, 5]]],
      [[[5, 7], [1, 3]], [[1, 3], [5, 7]]],
      [[[1, 4], [2, 3]], [[1, 4]]],
      [[[1, 1]], [[1, 1]]],
    ],
    hints: [
      "Overlap can only be decided reliably after ordering — sort intervals by start first.",
      "Keep the current merged end; if the next start <= end you extend end, otherwise start a new interval.",
      "sort by start; out = []; for [s,e]: if last and s <= last.end extend end else push [s,e]",
    ],
  },
  {
    id: "longest-increasing-subsequence",
    title: "Longest Increasing Subsequence",
    pattern: "Dynamic Programming",
    difficulty: "medium",
    statement: "Given an integer array nums, return the length of the longest strictly increasing subsequence.",
    concept:
      "dp[i] = length of the best increasing sequence ending at i, reused by later indexes — classic O(n²) DP. Recognise it when a longest/main/best result depends on an ordering and earlier choices constrain later ones.",
    starterJs: "// Longest Increasing Subsequence — return the length of the longest strictly\n// increasing subsequence in nums.\nfunction solution(nums) {\n  // Your code here\n  return 0;\n}\n",
    refJs:
      "function solution(nums) {\n  const dp = new Array(nums.length).fill(1);\n  let best = nums.length ? 1 : 0;\n  for (let i = 1; i < nums.length; i++) {\n    for (let j = 0; j < i; j++) {\n      if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);\n    }\n    best = Math.max(best, dp[i]);\n  }\n  return best;\n}\n",
    params: [
      [[10, 9, 2, 5, 3, 7, 101, 18], 4],
      [[0, 1, 0, 3, 2, 3], 4],
      [[7, 7, 7, 7, 7, 7, 7], 1],
      [[1, 2, 3, 4, 5], 5],
      [[5, 4, 3, 2, 1], 1],
    ],
    hints: [
      "An element can only extend sequences that end before it with a smaller value — think about what a single number knows.",
      "dp[i] is the answer to 'longest sequence ending exactly at i'; build it from every earlier smaller value.",
      "dp = [1]*n; for i: for j<i: if nums[j]<nums[i]: dp[i]=max(dp[i],dp[j]+1); answer = max(dp)",
    ],
  },
  {
    id: "word-ladder",
    title: "Word Ladder",
    pattern: "BFS",
    difficulty: "hard",
    statement: "Given beginWord, endWord and a dictionary wordList, return the length of the shortest transformation sequence from beginWord to endWord, such that only one letter changes per step and each transformed word must exist in wordList. Return 0 if no such sequence exists.",
    concept:
      "Each word is a node, and an edge connects words differing by one letter — the shortest path is BFS over words. Recognise it for 'shortest transformation/shortest path' where the state space is enumerable.",
    starterJs:
      "// Word Ladder — shortest transformation from beginWord to endWord, one letter\n// change per step, every intermediate word in wordList. Return 0 if impossible.\nfunction solution(beginWord, endWord, wordList) {\n  // Your code here\n  return 0;\n}\n",
    refJs:
      "function solution(beginWord, endWord, wordList) {\n  const words = new Set(wordList);\n  if (!words.has(endWord)) return 0;\n  let queue = [[beginWord, 1]];\n  while (queue.length) {\n    const next = [];\n    for (const [w, d] of queue) {\n      for (let i = 0; i < w.length; i++) {\n        for (let c = 97; c <= 122; c++) {\n          const cand = w.slice(0, i) + String.fromCharCode(c) + w.slice(i + 1);\n          if (cand === endWord) return d + 1;\n          if (words.has(cand)) {\n            words.delete(cand);\n            next.push([cand, d + 1]);\n          }\n        }\n      }\n    }\n    queue = next;\n  }\n  return 0;\n}\n",
    params: [
      [["hit", "cog", ["hot", "dot", "dog", "lot", "log", "cog"]], 5],
      [["hit", "cog", ["hot", "dot", "dog", "lot", "log"]], 0],
      [["hot", "dog", ["hot", "dot", "dog"]], 3],
      [["hit", "cog", ["hot", "cog"]], 2],
      [["dog", "dot", ["dog", "dot", "dtt"]], 2],
    ],
    hints: [
      "Two words are 'adjacent' when they differ by one letter — every path is a hop in a word graph.",
      "Shortest path over unweighted edges means breadth-first; visit each word at most once.",
      "set = wordList; queue = [(begin, 1)]; for each word try replacing each letter a-z; if reach end return depth+1; revisit-free BFS",
    ],
  },
  {
    id: "median-of-two-sorted-arrays",
    title: "Median of Two Sorted Arrays",
    pattern: "Binary Search",
    difficulty: "hard",
    statement: "Given two sorted arrays nums1 and nums2, return the median of the two sorted arrays combined. The overall run time complexity should be O(log(m + n)).",
    concept:
      "Median splits the merged array into equal halves, so binary-search the split point in the smaller array while the other split follows arithmetically. Recognise it for 'find the k-th element in two sorted arrays'.",
    starterJs:
      "// Median of Two Sorted Arrays — return the median of the combined sorted arrays.\nfunction solution(nums1, nums2) {\n  // Your code here\n  return 0;\n}\n",
    refJs:
      "function solution(nums1, nums2) {\n  let a = nums1, b = nums2;\n  if (a.length > b.length) [a, b] = [b, a];\n  let lo = 0, hi = a.length;\n  while (lo <= hi) {\n    const i = (lo + hi) >> 1;\n    const j = ((a.length + b.length + 1) >> 1) - i;\n    const aL = i === 0 ? -Infinity : a[i - 1];\n    const aR = i === a.length ? Infinity : a[i];\n    const bL = j === 0 ? -Infinity : b[j - 1];\n    const bR = j === b.length ? Infinity : b[j];\n    if (aL <= bR && bL <= aR) {\n      const total = a.length + b.length;\n      const left = Math.max(aL, bL);\n      return total % 2 ? left : (left + Math.min(aR, bR)) / 2;\n    }\n    if (aL > bR) hi = i - 1;\n    else lo = i + 1;\n  }\n  return 0;\n}\n",
    params: [
      [[[1, 3], [2]], 2],
      [[[1, 2], [3, 4]], 2.5],
      [[[], [1]], 1],
      [[[0, 0], [0, 0]], 0],
      [[[2], []], 2],
    ],
    hints: [
      "Don't merge; a median only needs the separating boundary between the two halves.",
      "Binary-search the split in the smaller array — the split in the other array is forced by the half-size condition.",
      "i in a, j=(total+1)/2 - i; valid when a[i-1]<=b[j] and b[j-1]<=a[i]; else move i",
    ],
  },
  {
    id: "max-of-list",
    title: "Maximum of List",
    pattern: "Arrays",
    difficulty: "easy",
    statement: "Given a list of integers nums, return the largest value in the list. You may assume the list is never empty. Python runs in-browser via self-hosted Pyodide — fully offline once loaded.",
    concept:
      "A single linear scan tracking the running maximum is optimal — every element must be seen at least once. Recognise it whenever the answer must dominate every input value.",
    starterPy:
      "# Maximum of List — return the largest integer in nums.\ndef solution(nums):\n    # Your code here\n    return 0\n",
    refPy:
      "def solution(nums):\n    largest = nums[0]\n    for n in nums:\n        if n > largest:\n            largest = n\n    return largest\n",
    params: [
      [[[3, 1, 2]], 3],
      [[[-5, -1, -9]], -1],
      [[[7]], 7],
      [[[10, 20, 30, 5]], 30],
      [[[1, 1, 1, 1]], 1],
    ],
    hints: [
      "The answer is just the biggest number you've seen so far — no comparisons between arbitrary pairs.",
      "Carry one 'best so far' through a single pass and update it when a larger value appears.",
      "best = nums[0]; for n in nums: if n > best: best = n; return best",
    ],
  },
];

const DIFF_RANK = { easy: 0, medium: 1, hard: 2 };

function buildSeedProblem(def) {
  const starter = { javascript: def.starterJs ?? "", python: def.starterPy ?? "" };
  const reference = {
    javascript: def.refJs ?? "",
    python: def.pythonRef ?? def.refPy ?? "",
  };
  const statement_md = `${def.statement}\n\n### Input and Output\nYour code is a function \`solution\`. Return the value exactly as expected; the judge compares with strict equality.\n\n### Examples\n${examples(def.title, def.params)}`;
  return {
    id: def.id,
    title: def.title,
    pattern: def.pattern,
    difficulty: def.difficulty,
    statement_md,
    concept_md: def.concept,
    mode: "function",
    compare: "exact",
    starter,
    reference,
    tests: tests(def.params),
    hints: def.hints,
  };
}

function readJsonOr(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

fs.mkdirSync(PROBLEMS_DIR, { recursive: true });

const seedIds = new Set(SEED.map((d) => d.id));
const seedByFile = {};

for (const def of SEED) {
  const target = path.join(PROBLEMS_DIR, `${def.id}.json`);
  // Seed files are canonical (regenerated from this script on every build);
  // only admin-published files in public/catalog are preserved as committed.
  fs.writeFileSync(target, JSON.stringify(buildSeedProblem(def), null, 2) + "\n");
  seedByFile[def.id] = target;
}

const existingIndex = readJsonOr(path.join(CATALOG_DIR, "index.json"), []);
const existingById = new Map(existingIndex.map((e) => [e.id, e]));

// Preserve committed (non-seed) entries whose problem file still exists.
const preserved = [];
for (const [id, entry] of existingById) {
  if (seedIds.has(id)) continue;
  if (!fs.existsSync(path.join(PROBLEMS_DIR, `${id}.json`))) continue;
  preserved.push({ ...entry, difficulty: entry.difficulty, live: entry.live === true });
}

// Regenerate seed entries fresh (difficulty/flags can change on rebuild).
const seedEntries = SEED.map((def) => ({
  id: def.id,
  title: def.title,
  pattern: def.pattern,
  difficulty: def.difficulty,
  live: true,
}));

const index = [...seedEntries, ...preserved].sort(
  (a, b) => DIFF_RANK[a.difficulty] - DIFF_RANK[b.difficulty] || a.title.localeCompare(b.title),
);

fs.writeFileSync(
  path.join(CATALOG_DIR, "index.json"),
  JSON.stringify(index, null, 2) + "\n",
);

console.log(`catalog: ${index.length} entries (${seedIds.size} seed, ${preserved.length} preserved), ${Object.keys(seedByFile).length} problem files`);