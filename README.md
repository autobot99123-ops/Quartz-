# 🪨 Quartz Judge

**AI-Powered Coding Platform** — LeetCode-style judge with AI tutor, built with Next.js, Supabase, Judge0, and Redis.

## Features

- 🧠 **AI Tutor** — Step-by-step hints (Nudge → Concept → Pseudo-Code)
- ⚡ **Instant Judge** — Code execution with verdicts (Accepted, Wrong Answer, TLE, RTE, Compile Error)
- 🎨 **Monaco Editor** — Full-featured code editor with syntax highlighting
- 🔐 **Auth** — Supabase authentication
- 📊 **Admin Panel** — Problem management, user management, test cases
- 📱 **PWA Ready** — Responsive design for all devices

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 + TypeScript |
| Styling | Tailwind CSS v4 |
| Editor | Monaco Editor |
| Backend | Supabase (Postgres, Auth, Storage) |
| Code Execution | Judge0 (Docker) |
| Queue | Redis + BullMQ |
| AI | LLM API with rate limiting |
| State | Zustand |

## Quick Start

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env.local

# Run dev server
npm run dev

# Build
npm run build
```

## Database

See `database/schema.sql` for the full schema. Run with Supabase CLI:

```bash
supabase db push
```

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/            # API routes
│   ├── auth/           # Login & Signup
│   ├── admin/          # Admin panel
│   ├── editor/         # Code editor
│   ├── ai-tutor/       # AI tutor page
│   └── profile/        # User profile
├── components/         # Reusable components
├── lib/               # Supabase client, types
├── store/             # Zustand state management
└── utils/             # Helper functions
database/
└── schema.sql          # PostgreSQL schema
```

## License

MIT © Quartz Judge
