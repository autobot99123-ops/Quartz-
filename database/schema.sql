-- =============================================
-- Quartz Judge Database Schema
-- =============================================

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Problems
CREATE TABLE problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  acceptance TEXT DEFAULT '0%',
  category TEXT NOT NULL,
  starter_code TEXT NOT NULL,
  test_cases JSONB NOT NULL DEFAULT '[]',
  time_limit_ms INT DEFAULT 2000,
  memory_limit_mb INT DEFAULT 256,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submissions
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID REFERENCES problems(id),
  user_id UUID REFERENCES users(id),
  code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'typescript',
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'error')),
  passed INT DEFAULT 0,
  total INT DEFAULT 0,
  time_ms INT DEFAULT 0,
  memory_kb INT DEFAULT 0,
  test_results JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Hints (cached)
CREATE TABLE hints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID REFERENCES problems(id),
  user_id UUID REFERENCES users(id),
  level TEXT CHECK (level IN ('nudge', 'concept', 'pseudo-code')),
  hint TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(problem_id, user_id, level)
);

-- Progress Tracking
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  problem_id UUID REFERENCES problems(id),
  solved BOOLEAN DEFAULT FALSE,
  best_score INT DEFAULT 0,
  last_submission_id UUID REFERENCES submissions(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, problem_id)
);

-- Admin Upload Log
CREATE TABLE problem_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id),
  problem_data JSONB NOT NULL,
  reference_solution_passed BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'draft')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_submissions_user ON submissions(user_id);
CREATE INDEX idx_submissions_problem ON submissions(problem_id);
CREATE INDEX idx_progress_user ON user_progress(user_id);
CREATE INDEX idx_progress_problem ON user_progress(problem_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE users, problems, submissions, hints, user_progress;

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Public read on problems" ON problems FOR SELECT USING (true);
CREATE POLICY "Users can read own submissions" ON submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert submissions" ON submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
