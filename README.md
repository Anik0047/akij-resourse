# akij-resource

Akij Resource is a Next.js 16 application for candidate and employer workflows. It uses Supabase for authentication, user profiles, and exam data, with shared UI primitives built on Tailwind CSS, shadcn-style components, and generated Boneyard skeleton assets.

## Tech Stack

- Next.js 16 with the App Router
- React 19
- Supabase SSR and Supabase Auth
- Tailwind CSS 4
- Zustand for client state
- Boneyard for skeleton generation
- Lucide icons and Radix UI primitives

## New Features

- Dedicated authentication entry points for each role:
  - Candidate login: `/auth/login/candidate`
  - Employer login: `/auth/login/employer`
  - Role chooser: `/auth/login`
- Employer test creation now supports a per-exam behavior policy threshold (`behavior_violation_limit`).
- Candidate exam session includes behavior tracking:
  - tab switch detection
  - fullscreen enter and exit detection
  - visual behavior warnings during the exam
- Automatic exam submission when behavior violations reach the configured per-exam limit.
- Full-screen blocking overlay during policy-triggered auto-submit to prevent interaction while answers are being saved.
- Employer candidate review modal now includes behavior summary analytics:
  - total events
  - tab switches
  - fullscreen exits
  - whether policy-based auto-submit occurred
  - latest behavior event timestamp

## Prerequisites

Install the following before you start:

- Node.js 20 or newer
- pnpm 9 or newer
- A Supabase project
- Supabase CLI if you want to manage the database locally from the checked-in migrations

## Setup

1. Install dependencies.

```bash
pnpm install
```

2. Create a local environment file.

Create a file named `.env.local` in the project root with the following values:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

These values are required by both the browser and server Supabase clients in `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, and `src/lib/supabase/proxy.ts`.

3. Create or link a Supabase project.

- In the Supabase dashboard, create a new project or open an existing one.
- Copy the project URL and the publishable key into `.env.local`.
- If you use a remote project, make sure the database schema matches the migrations in `supabase/migrations`.

4. Apply the database migrations.

The repository includes the full schema for auth profiles, employer/candidate role tables, exam data, online tests, and submission linking.

Latest additions also include behavior event tracking and per-exam behavior policy limits.

If you are using the Supabase CLI locally, apply the migrations in order. A typical flow is:

```bash
supabase start
supabase db reset
```

If you are working against a linked remote Supabase project, push the migrations instead:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

The checked-in migrations live in `supabase/migrations` and should be applied in timestamp order.

5. Start the development server.

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Common Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm bones
pnpm bones:watch
```

- `pnpm dev` starts the local Next.js development server.
- `pnpm build` creates a production build.
- `pnpm start` runs the production server after a build.
- `pnpm lint` runs ESLint.
- `pnpm bones` generates Boneyard output into `src/bones`.
- `pnpm bones:watch` rebuilds Boneyard output on file changes.

## Environment Variables

| Variable                               | Required | Purpose                                                     |
| -------------------------------------- | -------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | Supabase project URL used by browser and server clients     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | Supabase publishable key used by browser and server clients |

No other environment variables are currently required by the checked-in source.

## Database Setup

The Supabase schema under `supabase/migrations` includes:

- `user_profiles` and role enforcement
- `employees` and `candidates` tables
- `questions`, `exam_submissions`, and `exam_submission_answers`
- `online_tests`
- `online_tests.behavior_violation_limit` (per-exam threshold)
- `exam_behavior_events` for proctoring/behavior logs
- triggers for role syncing and ownership enforcement
- row-level security policies for authenticated access

If you add a new migration, keep the timestamped naming pattern so it applies in the correct order.

## Project Structure

```text
src/
	app/                 Next.js routes, pages, and route handlers
	components/          Shared UI and feature components
	hooks/               Client hooks and state helpers
	lib/                 Utilities, Supabase clients, and assessment helpers
	bones/               Generated Boneyard output
supabase/migrations/   SQL migrations for the database schema
```

## Key Routes

- `/auth/login`: role-aware login chooser
- `/auth/login/candidate`: candidate login page
- `/auth/login/employer`: employer login page
- `/auth/sign-up`, `/auth/forgot-password`, `/auth/update-password`: authentication flow
- `/candidate/dashboard`: candidate workspace
- `/candidate/exam/[id]`: candidate exam page
- `/employer/dashboard`: employer workspace
- `/employer/create-test`: test creation flow
- `/protected`: protected route example

## Notes

- The Supabase clients are created per request on the server to avoid session issues with Fluid compute.
- `reactCompiler` is enabled in `next.config.ts`.
- The project uses the Next.js App Router, so route files live under `src/app`.

## Deployment

This project can be deployed like a standard Next.js app. For production, make sure the same Supabase environment variables are configured in the hosting platform and that the database migrations have been applied.

For Vercel, the deployment flow is typically:

1. Push the repository to your Git provider.
2. Import the project into Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the Vercel environment settings.
4. Run the Supabase migrations against the target database.
5. Deploy.

## Additional Questions

### MCP Integration

I have not used MCP directly in this project yet. A practical use case here would be connecting Figma MCP for design handoff, Chrome DevTools MCP for debugging UI issues, or Supabase MCP for inspecting schema, policies, and migration state without leaving the editor.

### AI Tools for Development

The fastest workflow for frontend work is usually a mix of GitHub Copilot for inline implementation, ChatGPT or Claude for architecture and debugging help, and small repeatable prompts for tasks like component scaffolding, form wiring, and test case generation. The best results come from using AI to draft quickly, then reviewing the code manually for correctness, accessibility, and project conventions.

### Offline Mode

If a candidate loses internet during an exam, the safest approach is to keep the exam state local while the connection is down and sync it once the network returns. That means saving answers, timer state, and submission drafts in browser storage, showing a clear offline status banner, blocking duplicate submits, and reconnecting through a background sync queue or retry flow. For stricter integrity, the exam can also enforce an autosave cadence and a final server-side validation step before accepting the submission.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Deployment Docs](https://nextjs.org/docs/app/building-your-application/deploying)
