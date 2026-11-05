# TokenWise Agent

TokenWise Agent is a Next.js dashboard for exploring cost-aware and privacy-aware
AI coding workflows. It demonstrates model routing, file-context caching,
provider failover, spending limits, confidential-repository handling, and
approval gates for potentially destructive actions.

> **Status:** This is a functional prototype. Model calls and authentication
> are simulated in memory and are not intended for production use.

## Features

- **Task-based agent console** for submitting coding tasks and file context.
- **Model routing** that selects a lower-cost model for simple tasks and a
  stronger model for complex tasks.
- **Confidential mode** that routes work to a local model without cloud usage.
- **File-context caching** that reduces the estimated token count on repeated
  requests in the same server process.
- **Provider failover** simulation for testing backup-provider behavior.
- **Spending limits** that block requests when the estimated cost exceeds the
  configured budget.
- **Approval gates** for actions such as file writes, shell commands, and Git
  operations.
- **Demo authentication** with password hashing for the lifetime of the server
  process.

## Tech Stack

- [Next.js](https://nextjs.org/) 14
- React 18
- Three.js
- Lucide React
- Native Node.js crypto APIs for the authentication prototype

## Getting Started

### Prerequisites

- Node.js 18.17 or newer
- npm

### Installation

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Create a production build

```bash
npm run build
npm run start
```

## Available Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/signup` | Create a demo account |
| `/login` | Sign in to the demo account |
| `/dashboard` | Agent console |
| `/api/auth` | Signup and login API |
| `/api/agent` | Task routing and cost-estimation API |

## Using the Dashboard

1. Create an account at `/signup`, then sign in.
2. Enter a task in the dashboard.
3. Optionally provide comma-separated file names.
4. Set a spending limit.
5. Enable **Confidential repository** to force local routing.
6. Enable **Simulate provider outage** to test backup routing.
7. Run the task and review the activity log, token estimate, and spend.
8. Approve any requested actions such as file writes, shell commands, or Git
   operations.

The dashboard uses example values by default so the routing and approval
behavior can be demonstrated immediately.

## API Overview

### `POST /api/auth`

Request body:

```json
{
  "mode": "signup",
  "email": "you@example.com",
  "password": "at-least-6-characters"
}
```

Use `"mode": "login"` to sign in. Successful responses return the normalized
email address. Invalid credentials return an error response.

### `POST /api/agent`

Example request:

```json
{
  "user": "you@example.com",
  "task": "Fix the null check in auth.js and run the tests",
  "files": "src/auth.js, src/db.js",
  "limit": 0.05,
  "confidential": false,
  "outage": false,
  "approved": []
}
```

The response includes:

- Activity steps describing routing and cache behavior
- Estimated tokens and cost
- Current spend and configured limit
- Selected model/provider
- Actions pending user approval
- Whether the request was blocked by the spending limit

## Project Structure

```text
.
├── app/
│   ├── api/
│   │   ├── agent/route.js    # Routing, caching, budgets, failover, approvals
│   │   └── auth/route.js     # Prototype signup and login API
│   ├── dashboard/page.js     # Agent console
│   ├── login/page.js          # Login page
│   ├── signup/page.js         # Signup page
│   ├── globals.css            # Global styles
│   └── layout.js              # Root layout
├── components/
│   ├── AuthCard.js            # Shared authentication UI
│   └── Hero3D.js              # Landing-page 3D visual
├── package.json
└── package-lock.json
```

## npm Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create an optimized production build |
| `npm run start` | Start the production server |

## Current Prototype Limitations

- User accounts are stored in a process-local `Map`; restarting the server
  removes all accounts.
- The demo does not issue persistent sessions or tokens. The browser stores
  the signed-in email in `localStorage`.
- Agent model calls are simulated; no cloud gateway or Ollama request is made.
- Spend and file-cache state are stored in process memory.
- The API accepts illustrative file names but does not read files from disk.
- Add persistent storage, session management, authorization, input hardening,
  and real provider integrations before deploying to production.

## Connecting Real Models

The simulated model call is implemented in
`app/api/agent/route.js`. Replace the simulation with authenticated provider
integrations such as:

- A Bifrost or equivalent cloud gateway for hosted models
- Ollama for local model execution

Keep confidential-repository routing and spending-limit enforcement in place
when adding real providers.

## License

This project does not currently declare a license.
