export interface Problem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  acceptance: string;
  category: string;
  description: string;
  starterCode: string;
  testCases: TestCase[];
  timeLimit: number;
  memoryLimit: number;
  createdBy?: string;
}

export interface TestCase {
  id: number;
  input: string;
  expected: string;
}

export interface Submission {
  id: string;
  problemId: string;
  userId: string;
  code: string;
  language: string;
  status: "running" | "completed" | "error";
  passed: number;
  total: number;
  time: number;
  memory: number;
  testResults: TestResult[];
  createdAt: string;
}

export interface TestResult {
  id: number;
  input: string;
  expected: string;
  output: string;
  status: "Accepted" | "Wrong Answer" | "Time Limit Exceeded" | "Runtime Error" | "Compile Error";
}

export interface AIHint {
  hint: string;
  level: string;
}
