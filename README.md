# Debugr

Debugr is an AI-assisted code review and debugging workspace powered by Google Gemini. It gives developers a focused place to upload source files, inspect potential problems, and compare suggested corrections without leaving the browser.

The application is designed for an interactive review loop: choose a file, run an analysis, inspect the findings, and open a generated refactor in a code diff view. Debugr complements traditional tests and linters by explaining likely bugs and risks in the context of the code being reviewed.

## What it does

- **Authenticated workspace**: Register with an email and password or sign in with Google OAuth.
- **Local file review**: Upload source files or drag them into the workspace. File contents are loaded into the current browser session for review.
- **AI analysis**: Check for bugs, security vulnerabilities, style concerns, and performance bottlenecks. Each finding includes a line number, severity, explanation, and recommendation.
- **Deep debugging**: Focus an investigation on functional bugs, logical errors, runtime failures, and edge cases.
- **Refactor previews**: Open a suggested replacement in an inline diff view so the original code can be compared with the proposed change.
- **Multi-file workspace**: Keep several uploaded files available in the sidebar and switch between them while working.
- **Configurable review behavior**: Settings include automatic non-breaking fixes and deeper debugging analysis options.

## How a review works

1. Create an account or sign in.
2. Upload a code file from the workspace sidebar.
3. Select **Analyze** for a broad quality and security review, or **Debug** for a bug-focused investigation.
4. Read the structured findings in the review panel, including severity and affected line.
5. Select a finding with a proposed refactor to inspect the original and modified code in the diff viewer.

## Technology

- React 19 and TypeScript for the client application
- Vite for client development and bundling
- Express for the API server and production static-file serving
- Google Gemini for structured code analysis and debugging responses
- PostgreSQL for user accounts and authentication data
- JWT-based sessions stored in HTTP-only cookies
- Tailwind CSS, Motion, Lucide, and React Syntax Highlighter for the interface

## Project structure

```text
src/
  components/       Editor, diff viewer, review panel, sidebar, auth, and settings UI
  services/         Browser API client and Gemini integration types
  App.tsx           Authenticated workspace and review workflow
server.ts           Express server, authentication, and analysis endpoints
db.ts               PostgreSQL connection and user table initialization
api/index.js        Vercel serverless entry point
```

## Getting started

### Prerequisites

- Node.js 18 or newer
- npm
- A PostgreSQL database, such as a Supabase PostgreSQL project
- A Google Gemini API key

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env` file in the project root. The server reads these values at startup:

```env
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=replace_with_a_long_random_secret
PORT=3000
NODE_ENV=development
```

Google sign-in is optional. To enable it, also configure the OAuth client and callback URL:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
APP_URL=http://localhost:3000
```

The application creates the `users` table when it first connects to PostgreSQL. Never commit `.env` files or API keys to the repository.

### Run the development server

```bash
npm run dev
```

Open `http://localhost:3000` in a browser. The development server runs Express and Vite together and starts the database initialization on launch.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with Vite middleware |
| `npm run lint` | Run the TypeScript compiler without emitting files |
| `npm run build` | Build the client and bundled production server |
| `npm run preview` | Preview the Vite client build locally |
| `npm run start` | Start the bundled production server |
| `npm run clean` | Remove the `dist` directory |

## API endpoints

The API is served by the same Express application as the development client.

- `POST /api/auth/register` - Create an account
- `POST /api/auth/login` - Sign in with email and password
- `POST /api/auth/logout` - End the current session
- `GET /api/auth/me` - Return the current authenticated user
- `GET /api/auth/external/url` - Create the Google OAuth URL
- `POST /api/analyze` - Analyze a source file with Gemini
- `POST /api/debug` - Debug a source file with Gemini
- `GET /api/debug/health` - Inspect database and environment configuration

The analysis and debugging endpoints require an authenticated session.

## Production deployment

Build the application before starting it in production:

```bash
npm run build
npm run start
```

The repository also includes Vercel configuration in `vercel.json`. Set all required environment variables in the deployment provider, including `DATABASE_URL`, `GEMINI_API_KEY`, and a strong `JWT_SECRET`. Configure the Google OAuth callback as `<APP_URL>/auth/callback` when Google sign-in is enabled.

## License

MIT
