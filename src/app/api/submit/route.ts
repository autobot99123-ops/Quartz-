import { NextRequest, NextResponse } from "next/server";

// Simulate Judge0 code execution
// In production, this calls Judge0 API with the code, language, and test cases

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { problemId, code, language } = body;

    // Simulate queue processing (in production: BullMQ + Redis → Judge0)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock test results
    const testCases = [
      { id: 1, input: "[2,7,11,15], target=9", expected: "[0,1]", status: "Accepted" as const },
      { id: 2, input: "[3,2,4], target=6", expected: "[1,2]", status: "Accepted" as const },
      { id: 3, input: "[3,3], target=6", expected: "[0,1]", status: "Accepted" as const },
    ];

    const passed = testCases.filter((t) => t.status === "Accepted").length;

    return NextResponse.json({
      status: "completed",
      passed,
      total: testCases.length,
      time: Math.floor(Math.random() * 5) + 1,
      memory: Math.floor(Math.random() * 10) + 5,
      testCases,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to execute code" }, { status: 500 });
  }
}
