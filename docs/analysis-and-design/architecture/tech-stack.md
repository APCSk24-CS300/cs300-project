# Software Architecture: Tech Stack
**Workers:** Phan Minh Khoi  
**Reviewers:** Tran Ton Minh Ky  
**Editors:** Phan Minh Khoi

**Version:** 1.0.0  
**Amendment:** 2026/11/28

## 1. Purpose and scope

This document lists the technologies used to build and run myHCMUS and explains what each one is used for. It belongs to PA4 section B (Software Architecture). How these technologies fit together is shown in the [Container Diagram](container-diagram.md).

Every entry is taken from the source code on the `dev` branch at commit `95b150f` (2026/11/28), after the PA4 functional groups were merged. Each table has a **Source** column that points to the file where the technology is declared, so a reader can check it. Where a technology is configured but not used yet, the table says so. Planned technologies are listed separately in [section 7](#7-planned-or-not-yet-implemented), and known problems in [section 8](#8-known-issues).

## 2. Overview

myHCMUS is a web application with three parts: a frontend, a backend REST API and a relational database. All application code is written in TypeScript.

| Part | Main technology | How it is started | Source folder |
|---|---|---|---|
| Frontend | Next.js 16 with React 19 | `npm run dev` on Node.js. It uses the Next.js default port, `3000`, unless another port is given. | `src/client` |
| Backend | Express 5 on Node.js 22 | Docker container `myHCMUS-server`. It listens on `BACKEND_PORT`, which the Dockerfile sets to `8080`, and Docker Compose publishes `8080` to the host. | `src/server` |
| Database | PostgreSQL 18 with pgvector | Docker container `myHCMUS-db`, PostgreSQL's default port `5432`, published to the host by Docker Compose. | `src/db` |
| Local infrastructure | Docker Compose | `docker compose up` in `src` | `src/docker-compose.yml` |

The ports above are the current configuration values, not fixed requirements. They can be changed in `docker-compose.yml`, the Dockerfile and the environment files.

## 3. Frontend

The frontend is a Next.js application that uses the App Router. Pages live under `src/client/src/app`, and each business area has its own folder under `src/client/src/features` (`landing`, `activities`, `auth` and `services`).

| Technology | Version | Purpose in myHCMUS | Source |
|---|---|---|---|
| TypeScript | 5.x | Language for all frontend code. | `src/client/package.json` |
| Next.js (App Router, Turbopack) | 16.4.3 | Web framework. It provides routing, server rendering, the route guard in `proxy.ts`, and the Route Handlers under `src/app/api`: the backend forwarder `/api/backend/*` and the mock login `/api/auth/login`. | `src/client/package.json`, `src/client/next.config.ts` |
| React and React DOM | 19.3.0 | UI library. Screens are built from function components and hooks. | `src/client/package.json` |
| Tailwind CSS | 4.x | Styling. Design tokens are defined in `src/app/globals.css`. It is loaded through `@tailwindcss/turbopack`. | `src/client/package.json`, `src/client/next.config.ts` |
| React Hook Form | 7.x | Form state for the login form and the service link form. | `src/client/src/components/forms/LoginForm.tsx`, `src/client/src/features/services/admin/components/ServiceLinkForm.tsx` |
| Zod (with `@hookform/resolvers`) | 4.x | Validation of form input, for example the login and service link schemas. | `src/client/src/features/auth/schema/login.schema.ts`, `src/client/src/features/services/admin/schema/serviceLink.schema.ts` |
| jose | 6.x | Signs and verifies the JWT stored in the frontend's own `session` cookie (HS256). | `src/client/src/libs/session.ts`, `src/client/src/app/api/auth/login/route.ts` |
| Fetch API (built into the browser and Node.js) | n/a | HTTP calls from the browser go through one wrapper, `api-client.ts`, which also turns error responses into an `ApiError` with the backend's field errors. The backend forwarder calls `fetch` directly on the server side. No extra HTTP library is used. | `src/client/src/libs/api-client.ts`, `src/client/src/app/api/backend/[...path]/route.ts` |
| `next/font` (Geist, Geist Mono) | bundled with Next.js | Loads the fonts of the site. | `src/client/src/app/layout.tsx` |

**Frontend testing and code quality**

| Technology | Version | Purpose in myHCMUS | Source |
|---|---|---|---|
| Vitest | 3.x | Test runner for unit and component tests (`npm test`), for files matching `src/**/*.test.{ts,tsx}`. | `src/client/vitest.config.ts` |
| React Testing Library, `user-event`, `jest-dom` | 16.x, 14.x, 6.x | Render components in tests and simulate user actions. | `src/client/tests/setup.ts` |
| jsdom | 25.x | Browser-like environment for the tests. | `src/client/vitest.config.ts` |
| axe-core | 4.x | Automated accessibility checks in component tests. | `src/client/tests/test-utils.tsx` |
| ESLint with `eslint-config-next` | 9.x | Static code checks (`npm run lint`). | `src/client/eslint.config.mjs` |

## 4. Backend

The backend is a REST API that returns JSON. The code is layered: route, middleware, controller, service, then repository or client (`src/server/src/routes`, `middleware`, `controllers`, `services`, `repositories`, `clients`). The AI module has its own folder, `src/server/src/ai`, with the gateway, settings, usage logging and system prompt. The endpoints are listed in the [Container Diagram](container-diagram.md#42-backend-rest-api).

| Technology | Version | Purpose in myHCMUS | Source |
|---|---|---|---|
| Node.js | 22 | JavaScript runtime. The version is fixed by the Docker base image `node:22`. | `src/server/Dockerfile` |
| TypeScript | 6.x | Language for all backend code. The code runs as ES modules (`"type": "module"`). | `src/server/package.json`, `src/server/tsconfig.json` |
| Express | 5.x | HTTP framework. It defines the routes and the middleware chain. | `src/server/src/app.ts` |
| body-parser | 2.x | Parses JSON request bodies. | `src/server/src/app.ts` |
| morgan | 1.x | Logs every HTTP request to the console. | `src/server/src/app.ts` |
| jsonwebtoken | 9.x | Creates the access token returned by `/api/auth/login` (valid for 1 hour) and verifies the Bearer token on protected routes (`validateAccessToken`). | `src/server/src/services/AuthService.ts`, `src/server/src/middleware/ValidatorMiddleware.ts` |
| bcrypt | 6.x | Hashes passwords with 10 salt rounds. The plain password is never stored. | `src/server/src/services/AuthService.ts` |
| node-postgres (`pg`) | 8.x | PostgreSQL driver. The server keeps two connection pools and sends plain SQL, with no ORM. The main pool serves authentication, permission checks and the University Services Hub. The AI pool logs in as the restricted database role `ai_gateway`. | `src/server/src/connections/db.ts`, `src/server/src/connections/aiDb.ts` |
| dotenv | 18.x | Loads settings from environment variables. See [section 6.3](#63-environment-variables). | `src/server/src/config/config.ts` |
| nodemon and ts-node | installed in the image | Run the TypeScript code directly and restart the server when a file changes (`npm start`). | `src/server/Dockerfile`, `src/server/package.json` |
| Node.js test runner (`node:test`) | built into Node.js | Backend unit and integration tests (`npm test`, files `tests/**/*.test.ts`). The tests replace the AI client and the database stores with fakes. | `src/server/package.json`, `src/server/tests` |
| TypeDoc with TSDoc | 0.28.x | Generates API reference pages from the code comments in `src/services` and `src/types` (`npm run generate-docs`). | `src/server/typedoc.json`, `src/server/tsdoc.json` |

**Google Gemini API.** The AI Student Assistant calls Google's Generative Language REST API (`generateContent`) directly with the Fetch API, with no Google SDK. The API key is sent in the `x-goog-api-key` header and each call has a 20-second timeout. The answer model is set by `GEMINI_MODEL` (`gemini-2.5-flash` in the example file). Settings for a classifier model and an embedding model also exist, but no code uses them yet. Source: `src/server/src/clients/GeminiClient.ts`, `src/server/src/config/config.ts`.

## 5. Database

| Technology | Version | Purpose in myHCMUS | Source |
|---|---|---|---|
| PostgreSQL | 18 | Relational database for all persistent data: users, roles and permissions, activities, registrations, participation, training scores, requests and appeals, notifications, university service links, the audit log, and the AI module's settings and logs. | `src/docker-compose.yml` (image `pgvector/pgvector:pg18-trixie`) |
| pgvector | extension in the image | Adds the `vector` column type. `AiKnowledgeChunk.embedding` is `vector(768)`, prepared for searching the AI assistant's knowledge base. | `src/db/ai_schema.sql` |
| SQL schema scripts | n/a | `schema.sql` creates the `myHCMUS` database and its 45 core tables. `hub_schema.sql` adds the hub constraints, the two hub permissions and the six service links. `ai_schema.sql` adds 7 AI tables, the `ai_*_v` views and the `ai_gateway` role with its `GRANT`s. They are applied manually with `psql`, because `docker-compose.yml` does not load them. No migration tool is used. | `src/db/schema.sql`, `src/db/hub_schema.sql`, `src/db/ai_schema.sql`, `src/db/README.md` |
| SQL seed scripts | n/a | `seed.sql` runs `seed_lookups_and_junctions.sql`, `seed_entities.sql` and `seed_ai.sql` to fill the tables with development data, including demo accounts and 100 activities. The AI fixtures are added only when `ai_schema.sql` is installed. | `src/db/seed.sql`, `src/db/README.md` |
| SQL constraint tests | n/a | `hub_schema_test.sql` checks the hub constraints. `schema_constraints_test.sql` is **outdated**: it was written for an earlier 27-table schema, uses tables and roles that no longer exist (for example `UserInterest`, `organizer` and `reviewer`), and fails against the current `schema.sql`. | `src/db/hub_schema_test.sql`, `src/db/schema_constraints_test.sql` |
| Docker named volume | n/a | Keeps the database files when the container is recreated (`myHCMUS-db`). | `src/docker-compose.yml` |

## 6. Other components

### 6.1 Authentication and authorization

myHCMUS does not use an external authentication service. On `dev` there are two token mechanisms:

| | Frontend session | Backend access token |
|---|---|---|
| Created by | The mock Route Handler `src/app/api/auth/login/route.ts`, which checks three hard-coded test accounts | `POST /api/auth/login`, which checks the email and bcrypt hash in the database |
| Format | JWT signed with `SESSION_SECRET` (jose), valid for 7 days | JWT signed with `JWT_SECRET` (jsonwebtoken), valid for 1 hour |
| Stored or sent as | `httpOnly` cookie named `session` | `Authorization: Bearer` header |
| Used by | `proxy.ts`, which reads the cookie on page requests | `validateAccessToken` on the hub and AI routes |

The two are **not linked yet**. The login form uses `mockAuthService`, and backend login does not work end to end (section 8). To call the backend in the meantime, the backend forwarder sends a development-only token from `DEV_BACKEND_TOKEN`, which is created with `src/server/scripts/mint-dev-token.ts` for a seeded user.

**Permissions.** The backend checks permissions on every protected route by reading the user's roles from the database (`LoadIdentity`, `RequirePermission`, `IdentityRepository`). The hub uses `hub.services.read` and `hub.services.manage`, and the AI assistant uses `ai.chat` (students and managers).

**Route guard.** `proxy.ts` sends visitors without a session to `/login` and redirects a role that is not allowed on `/student`, `/manager`, `/admin` or `/services` paths.

**Roles.** The database and the backend use the role codes `student`, `manager` and `administrator`. The frontend uses `student`, `manager` and `admin`. `src/client/src/libs/roles.ts` defines `toBackendRole` and `fromBackendRole` to map between them, but no code calls them yet.

### 6.2 Infrastructure

| Technology | Purpose in myHCMUS | Source |
|---|---|---|
| Docker and Docker Compose | Build and start the backend and the database with one command (`docker compose up` in `src`). The two containers share a Compose network, and the server reaches the database by the host name `db`. The frontend is not part of Compose. | `src/docker-compose.yml`, `src/server/Dockerfile` |

The repository contains no configuration for cloud hosting, cloud storage or a CI/CD pipeline. Hosting is covered by the deployment diagram.

### 6.3 Environment variables

Each table lists the variables the code actually reads.

**Backend** (`src/server/src/config/config.ts`, loaded with dotenv and from `server/.env` by Docker Compose)

| Variable | Used for |
|---|---|
| `BACKEND_PORT` | Port the server listens on (`8080` in the Dockerfile). |
| `JWT_SECRET` | Signing and verifying backend access tokens. |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Main database pool. The host is fixed to `db` and the port to `5432` in the code. |
| `AI_DB_USER`, `AI_DB_PASSWORD` | AI database pool (`ai_gateway` by default). |
| `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_BACKUP_MODEL` | Gemini API key and answer model. |
| `AI_HISTORY_SECRET`, `GEMINI_CLASSIFIER_MODEL`, `GEMINI_EMBEDDING_MODEL` | Read into the configuration. No code uses them yet. |

`src/server/.env.example` lists all of these except the three `POSTGRES_*` variables, and also lists `DATABASE_URL`, which the code does not read.

**Database** (`src/db/.env`, read by the PostgreSQL image): `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`. An example is in `src/db/.env.example`.

**Frontend** (`src/client/.env.example`)

| Variable | Used for |
|---|---|
| `SESSION_SECRET` | Signing and verifying the `session` cookie. |
| `NEXT_PUBLIC_DATA_SOURCE` | `api` makes the activity and hub services call the backend. Anything else keeps mock data. |
| `NEXT_PUBLIC_API_BASE_URL` | Base address for `api-client.ts` (`/api/backend` in the example). |
| `BACKEND_API_URL` | Server-side only: where the forwarder sends requests (`http://localhost:8080/api/v1` in the example). |
| `DEV_BACKEND_TOKEN` | Server-side only, development only: the Bearer token the forwarder sends. |

The mock services also read `NEXT_PUBLIC_MOCK_ACTIVITY_SCENARIO` and `NEXT_PUBLIC_MOCK_AUTH_STATE`, which are not in the example file.

### 6.4 Documentation and process tools

These tools support the team's work and are not part of the running system. Details are in [devtools-and-process.md](../../management/devtools-and-process.md).

| Tool | Purpose |
|---|---|
| OpenAPI 3.0 with Swagger UI | API contract in `docs/api/openapi.yaml`, viewable through `docs/api/index.html`. |
| Git and GitHub | Version control, pull requests and code review. |
| GitHub Spec Kit | Spec-driven workflow (specify, plan, tasks, implement). Artifacts are in `src/specs` and `src/client/specs`. |
| Jira | Sprint planning and task tracking. |
| AI coding assistants | Support for implementation and self-learning, declared in the AI usage reports. |

## 7. Planned or not yet implemented

| Technology | Intended use | Status |
|---|---|---|
| Email service | Delivery channel for UC-17 "Receive activity notifications". | The database models it (`NotificationDelivery` has an `email` channel), but no code sends email and no provider is chosen. |
| Gemini classifier and embedding models, pgvector search | Topic classification and knowledge-base search for the AI assistant. | Settings, the `vector(768)` column and the `ai_gateway` grants exist. No code calls these models or searches vectors yet. |
| Hosting platform | Makes the system reachable outside a developer machine. | Not chosen. See the deployment diagram. |
| Docker image for the frontend | Lets the frontend start together with the backend and the database. | The frontend is not in `docker-compose.yml`. |

## 8. Known issues

These are differences between the code and its intended behavior that affect the tech stack. Each should be fixed in code, and this document updated in the same pull request.

1. **Backend login and registration do not work end to end.** In `AuthRepository.ts`, `checkUserExistsWithEmail` and `checkUserExistsWithPhoneNumber` always return true, so registration answers `409`. `getUserFromEmail`, `getUserPasswordHash` and `getName` return whole rows instead of values, so login fails with `500`.
2. **The two token mechanisms are not linked**, so the forwarder relies on the development-only `DEV_BACKEND_TOKEN` (section 6.1).
3. **A hard-coded development token is accepted.** `validateAccessToken` accepts a fixed token string. It must be removed before release.
4. **The activity list cannot use the backend.** `activity.service.ts` calls `/activities/landing`, which the forwarder's allow list rejects and the backend does not provide.
5. **Route guard bugs in `proxy.ts`.** A forbidden role is sent to `/forbiden` instead of `/forbidden`. The redirect for a logged-in user on `/login` uses `return` inside `forEach`, so it never takes effect.
6. **The health check does not test the database.** The query in `databaseCheckHelper.ts` is commented out.
7. **Example environment files are incomplete** (section 6.3).
8. **The core constraint test script is outdated** (section 5).
