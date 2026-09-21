import { NextRequest, NextResponse } from "next/server";

// In production: LLM API with strict prompts, caching, and rate limits
// Using OpenAI/Anthropic API with the problem, code, and test failure data

export async function POST(request: NextRequest) {
  try {
    const { problem, userCode, failingTest, error, level } = await request.json();

    // Simulate AI response (in production: call LLM API)
    const hints = {
      nudge: `Think about what data structure would help you find pairs that sum to the target efficiently. Can you solve this in one pass?`,
      concept: `Use a HashMap (or object in JS). Store each number and its index as you iterate. For each number, check if (target - number) exists in the map.`,
      "pseudo-code": `1. Create an empty hash map called numMap\n2. Loop through the array with index i\n3. Calculate complement = target - nums[i]\n4. If complement is in numMap, return [numMap[complement], i]\n5. Otherwise, store numMap[nums[i]] = i`,
    };

    const hint = hints[level as keyof typeof hints] || hints.nudge;

    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json({ hint });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get hint" }, { status: 500 });
  }
}
