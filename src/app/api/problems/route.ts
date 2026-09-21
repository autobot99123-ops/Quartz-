import { NextRequest, NextResponse } from "next/server";

// In production: Query Supabase Postgres
export async function GET(request: NextRequest) {
  const problems = [
    { id: "1", title: "Two Sum", difficulty: "Easy", acceptance: "52%", category: "Arrays" },
    { id: "2", title: "Valid Parentheses", difficulty: "Easy", acceptance: "48%", category: "Stacks" },
    { id: "3", title: "Merge Intervals", difficulty: "Medium", acceptance: "38%", category: "Sorting" },
  ];
  return NextResponse.json(problems);
}
