import type { JudgeTestCase } from "@/lib/judge/types";

export type CatalogDifficulty = "easy" | "medium" | "hard";
export type CatalogLanguage = "javascript" | "python";

export interface CatalogEntry {
  id: string;
  title: string;
  pattern: string;
  difficulty: CatalogDifficulty;
  /** Students see only entries with live === true. */
  live: boolean;
}

export interface CatalogTest {
  in: unknown[];
  out: unknown;
  hidden: boolean;
}

export interface CatalogProblem {
  id: string;
  title: string;
  pattern: string;
  difficulty: CatalogDifficulty;
  statement_md: string;
  concept_md: string;
  mode: "function";
  compare: "exact";
  starter: Partial<Record<CatalogLanguage, string>>;
  reference: Partial<Record<CatalogLanguage, string>>;
  tests: CatalogTest[];
  hints: string[];
}

export const DIFFICULTY_LABEL: Record<CatalogDifficulty, "Easy" | "Medium" | "Hard"> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

let catalogCache: CatalogEntry[] | null = null;

/** Fetch the small catalog index (id/title/pattern/difficulty/live) once per
 *  page session. Falls back to the precached copy when offline. */
export async function fetchCatalogIndex(): Promise<CatalogEntry[]> {
  if (catalogCache) return catalogCache;
  const res = await fetch("/catalog/index.json");
  if (!res.ok) throw new Error("Failed to load problem catalog");
  catalogCache = (await res.json()) as CatalogEntry[];
  return catalogCache;
}

const problemCache = new Map<string, CatalogProblem>();

/** Fetch one problem's full content. The SW caches these after first fetch
 *  (and precaches live ones), so a re-open works offline. */
export async function fetchCatalogProblem(id: string): Promise<CatalogProblem> {
  const cached = problemCache.get(id);
  if (cached) return cached;
  const res = await fetch(`/catalog/problems/${id}.json`);
  if (!res.ok) throw new Error("Failed to load problem");
  const problem = (await res.json()) as CatalogProblem;
  problemCache.set(id, problem);
  return problem;
}

/** Languages a problem actually supports: derived from which reference
 *  solutions exist (empty reference = language not authored/validated). */
export function inferLanguages(problem: CatalogProblem): CatalogLanguage[] {
  const js = (problem.reference?.javascript ?? "").trim();
  const py = (problem.reference?.python ?? "").trim();
  if (js && py) return ["javascript", "python"];
  if (py) return ["python"];
  return ["javascript"];
}

export function starterFor(
  problem: CatalogProblem,
  language: CatalogLanguage,
): string {
  return problem.starter?.[language] ?? "";
}

/** Display string for a function call's args, e.g. `solution([2,7,11,15], 9)`. */
export function argsText(args: unknown[]): string {
  return `solution(${args.map((a) => JSON.stringify(a)).join(", ")})`;
}

/** Adapter from the committed catalog schema to the judge's test shape. */
export function toJudgeTestCases(problem: CatalogProblem): JudgeTestCase[] {
  return problem.tests.map((t, idx) => ({
    id: idx + 1,
    input: argsText(t.in),
    args: t.in,
    expected: t.out,
    expectedText: JSON.stringify(t.out),
  }));
}