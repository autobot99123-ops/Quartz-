export interface PromptTemplateOptions {
  /** Slot the new problem belongs to (e.g. "two-pointers / two-sum pair"). */
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
}

/** The exact prompt the curator sends the AI to author a validated, ready-to-
 *  publish problem. Used by the Admin workbench "Copy Prompt" action.
 *
 *  Rules baked in: output ONLY valid JSON (no markdown fences, no commentary),
 *  never reproduce an existing problem statement verbatim — always fresh
 *  wording, and every reference solution must pass every provided test. */
export function buildCuratorPrompt(opts: PromptTemplateOptions = {}): string {
  const topic = opts.topic || "<target pattern / problem area>";
  const difficulty = opts.difficulty || "<easy | medium | hard>";
  return `You are authoring a coding problem for a self-contained in-browser judge that runs function-mode solutions in JavaScript (and Python via Pyodide). Students see the statement, concept note, starter code, the judge, and three progressive hints. There is no server.

Slot: ${topic}
Difficulty: ${difficulty}

Requirements
- The problem must be solvable with a single function named \`solution\` taking the parameters you define.
- Write a completely ORIGINAL statement. Never copy any existing problem's wording (e.g. LeetCode) verbatim — paraphrase every element into fresh prose while keeping the underlying idea.
- Include at least 5 test cases covering important edge cases (empty input, negatives, duplicates, single element, etc.).

Respond with ONLY a single valid JSON object, no markdown code fences, no explanation, matching exactly this schema:

{
  "title": "short title",
  "pattern": "one category, e.g. Two Pointers | Hash Map | Stacks | ...",
  "difficulty": "easy | medium | hard",
  "statement_md": "markdown: original statement + Input/Output format + 2 worked examples with expected outputs",
  "concept_md": "1-2 sentences: the algorithm/pattern, time & space complexity, and when to recognise it",
  "mode": "function",
  "compare": "exact",
  "starter": { "javascript": "…", "python": "…" },
  "reference": { "javascript": "…", "python": "…" },
  "tests": [
    { "in": [ "arg1", "arg2", ... ], "out": "expected value", "hidden": false }
  ],
  "hints": [
    "nudge: hint pointing in the right direction without giving the answer away",
    "concept: the algorithm/pattern to apply",
    "pseudocode: pseudocode-level sketch"
  ]
}

Rules
- \`starter\` and \`reference\` must define BOTH "javascript" AND "python" implementations, and both reference solutions must pass EVERY test case exactly (use strict equality).
- tests[].in is the positional argument list to solution(...); tests[].out is the exact expected return value.
- hints must be exactly 3 strings ordered: nudge, concept, pseudocode.
- difficulty must be one of easy | medium | hard.
`;
}