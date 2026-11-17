# Software Architecture: Tech Stack
**Workers:** Phan Minh Khoi
**Reviewers:**  Tran Ton Minh Ky
**Editors:** Phan Minh Khoi

**Version:** 0.1.0 (draft)  
**Amendment:** 2026/11/17

## 1. Purpose and scope

This document lists the technologies used to build and run myHCMUS and explains what each one is used for. It belongs to PA4 section B (Software Architecture). The container diagram that shows how these technologies fit together is in [container-diagram.md](container-diagram.md).

Every entry is taken from the source code on the `dev` branch (commit `f2ca6f3`, 2026/11/17). Each table has a **Source** column that points to the file where the technology is declared, so a reader can check it. Technologies that are decided but not yet merged into `dev` are listed separately in [section 7](#7-planned-or-not-yet-on-dev) and are not presented as implemented.

## 2. Overview

myHCMUS is a web application with three parts: a frontend, a backend API, and a relational database. All application code is written in TypeScript.

| Part | Main technology | Runs on | Source folder |
|---|---|---|---|
| Frontend (client) | Next.js 16 with React 19 | Node.js, port `3000` in development | `src/client` |
| Backend (server) | Express 5 on Node.js 22 | Docker container `myHCMUS-server`, port `8080` | `src/server` |
| Database | PostgreSQL 18 | Docker container `myHCMUS-db`, port `5432` | `src/db` |
| Local infrastructure | Docker Compose | Developer machine | `src/docker-compose.yml` |

## 3. Frontend

The frontend is a Next.js application that uses the App Router. Pages live under `src/client/src/app`, and each business area has its own folder under `src/client/src/features` (currently `landing`, `activities` and `auth`).

| Technology | Version | Purpose in myHCMUS | Source |
|---|---|---|---|
| TypeScript | 5.x | Language for all frontend code. | `src/client/package.json` |
| Next.js (App Router, Turbopack) | 16.4.3 | Web framework. It provides routing, server rendering, the route guard in `proxy.ts`, and Route Handlers under `src/app/api`. | `src/client/package.json`, `src/client/next.config.ts` |
| React and React DOM | 19.3.0 | UI library. Screens are built from function components and hooks. | `src/client/package.json` |
| Tailwind CSS | 4.x | Styling. Design tokens are defined in `src/app/globals.css`. It is loaded through `@tailwindcss/turbopack`. | `src/client/package.json`, `src/client/next.config.ts` |
| React Hook Form | 7.x | Form state for the login form. | `src/client/src/components/forms/LoginForm.tsx` |
| Zod (with `@hookform/resolvers`) | 4.x | Validation of form input, for example the login schema. | `src/client/src/features/auth/schema/login.schema.ts` |
| jose | 6.x | Signs and verifies the JWT stored in the `session` cookie (HS256). | `src/client/src/libs/session.ts`, `src/client/src/app/api/auth/login/route.ts` |
| Fetch API (built into the browser and Node.js) | n/a | HTTP calls to the backend through one wrapper, `api-client.ts`. No extra HTTP library is used. | `src/client/src/libs/api-client.ts` |
| `next/font` (Geist, Geist Mono) | bundled with Next.js | Loads the fonts of the site. | `src/client/src/app/layout.tsx` |

**Frontend testing and code quality**

| Technology | Version | Purpose in myHCMUS | Source |
|---|---|---|---|
| Vitest | 3.x | Test runner for unit and component tests (`npm test`). | `src/client/vitest.config.ts` |
| React Testing Library, `user-event`, `jest-dom` | 16.x, 14.x, 6.x | Render components in tests and simulate user actions. | `src/client/tests/setup.ts` |
| jsdom | 25.x | Browser-like environment for the tests. | `src/client/vitest.config.ts` |
| axe-core | 4.x | Automated accessibility checks in component tests. | `src/client/tests/test-utils.tsx` |
| ESLint with `eslint-config-next` | 9.x | Static code checks (`npm run lint`). | `src/client/eslint.config.mjs` |

## 4. Backend

The backend is a REST API that returns JSON. The code is layered: route, then controller, then service, then repository (`src/server/src/routes`, `controllers`, `services`, `repositories`).

| Technology | Version | Purpose in myHCMUS | Source |
|---|---|---|---|
| Node.js | 22 | JavaScript runtime. The version is fixed by the Docker base image `node:22`. | `src/server/Dockerfile` |
| TypeScript | 6.x | Language for all backend code. The code runs as ES modules (`"type": "module"`). | `src/server/package.json`, `src/server/tsconfig.json` |
| Express | 5.x | HTTP framework. It defines the routes and the middleware chain. | `src/server/src/index.ts` |
| body-parser | 2.x | Parses JSON request bodies. | `src/server/src/index.ts` |
| morgan | 1.x | Logs every HTTP request to the console. | `src/server/src/index.ts` |
| jsonwebtoken | 9.x | Creates the access token at login (valid for 1 hour). The middleware that verifies it (`validateAccessToken`) is written, but no route on `dev` uses it yet. | `src/server/src/services/AuthService.ts`, `src/server/src/middleware/ValidatorMiddleware.ts` |
| bcrypt | 6.x | Hashes passwords with 10 salt rounds. The plain password is never stored. | `src/server/src/services/AuthService.ts` |
| node-postgres (`pg`) | 8.x | PostgreSQL driver. The server keeps one connection pool and sends plain SQL. No ORM is used. | `src/server/src/connections/db.ts`, `src/server/src/repositories/AuthRepository.ts` |
| dotenv | 18.x | Loads settings such as the port, the JWT secret and the database credentials from environment variables. | `src/server/src/config/config.ts` |
| nodemon and ts-node | installed in the image | Run the TypeScript code directly and restart the server when a file changes (`npm start`). | `src/server/Dockerfile`, `src/server/package.json` |
| TypeDoc and TSDoc | configured | Generate API reference pages from code comments (`npm run generate-docs`). See the note in [section 8](#8-notes-for-the-team). | `src/server/typedoc.json`, `src/server/tsdoc.json` |

## 5. Database

| Technology | Version | Purpose in myHCMUS | Source |
|---|---|---|---|
| PostgreSQL | 18 | Relational database for all persistent data: users, roles, activities, registrations, participation, training scores, requests and appeals, notifications, and the audit log. | `src/docker-compose.yml` (image `postgres:18`) |
| SQL schema script | n/a | `schema.sql` creates the `myHCMUS` database and its 45 tables with keys and `CHECK` constraints. `schema_constraints_test.sql` tests those constraints. The script is applied manually with `psql`. No migration tool is used. | `src/db/schema.sql`, `src/db/schema_constraints_test.sql` |
| Docker named volume | n/a | Keeps the database files when the container is recreated (`myHCMUS-db`). | `src/docker-compose.yml` |

## 6. Other components

### 6.1 Authentication and authorization

myHCMUS does not use an external authentication service. Authentication is built into the system with the libraries listed above.

- **Password storage:** bcrypt hash in the `User` table.
- **Backend access token:** a JWT signed with `JWT_SECRET`, sent by the client as `Authorization: Bearer <token>`.
- **Frontend session:** a JWT in an `httpOnly` cookie named `session`, signed with `SESSION_SECRET`. `proxy.ts` reads it on every page request, sends visitors without a session to `/login`, and blocks roles that are not allowed on `/student`, `/manager` and `/admin` routes.
- **Roles:** student, manager and administrator, stored in the `Role`, `Permission`, `RolePermission` and `UserRole` tables.

### 6.2 Infrastructure and environment

| Technology | Purpose in myHCMUS | Source |
|---|---|---|
| Docker and Docker Compose | Build and start the backend and the database with one command (`docker compose up` in `src`). The two containers share a Compose network, and the server reaches the database by the host name `db`. | `src/docker-compose.yml`, `src/server/Dockerfile` |
| Environment files (`.env`) | Hold the settings and secrets of each part. Examples without secrets are in `.env.example`. | `src/server/.env.example`, `src/db/.env.example` |
| VS Code task | Starts Docker Desktop if needed and runs `docker compose up` when the project folder is opened. | `.vscode/tasks.json`, `.vscode/compose-up.ps1` |

There is no cloud hosting, cloud storage or CI/CD pipeline in the repository yet. The system currently runs on the developer's machine.

### 6.3 Development process tools

These tools support the team's work and are not part of the running system. Details are in [devtools-and-process.md](../../management/devtools-and-process.md).

| Tool | Purpose |
|---|---|
| Git and GitHub | Version control, pull requests and code review. |
| GitHub Spec Kit | Spec-driven workflow (specify, plan, tasks, implement). Artifacts are in `src/specs` and `src/client/specs`. |
| Jira | Sprint planning and task tracking. |
| AI coding assistants | Support for implementation and self-learning, declared in the AI usage reports. |

## 7. Planned or not yet on `dev`

The items below are part of the product vision but are not in the `dev` branch at the time of writing. They must be moved into the sections above when they are merged.

| Technology | Intended use | Status |
|---|---|---|
| Google Gemini API (`gemini-2.5-flash`) | Answers student questions for UC-06 "Chat with AI Student Assistant". | Implemented on the branch `feat/backend/implement-ai-endpoint`, not merged. |
| Email service | Delivery channel for UC-17 "Receive activity notifications". | No provider chosen and no code yet. |
| Hosting platform | Makes the system reachable outside a developer machine. | Not chosen. See the deployment diagram. |
| Docker image for the frontend | Lets the frontend start together with the backend and the database. | The frontend is not in `docker-compose.yml` yet. |

## 8. Notes my teammates

These are differences between the code and what a reader might expect. They do not change the tech stack, but the architecture documents must stay consistent with the code, so each one should be either fixed in code or kept in mind when the diagrams are updated.

1. **TypeDoc is not in `package.json` on `dev`.** The script `generate-docs` and the files `typedoc.json` and `tsdoc.json` exist, but the `typedoc` package is only added on the branch `feat/backend/implement-ai-endpoint`.
2. **The frontend still uses mock data.** `AuthProvider` uses `mockAuthService`, and the activity list uses `MockActivityService` unless `NEXT_PUBLIC_DATA_SOURCE=api` is set. The real services that call the backend already exist in the code.
3. **The backend has no test runner on `dev`.** `npm test` in `src/server` only prints an error message.
4. **The schema is not loaded automatically.** `docker-compose.yml` does not mount `schema.sql` into the database container.
