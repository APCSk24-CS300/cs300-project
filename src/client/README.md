This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## myHCMUS frontend setup

```bash
npm install
cp .env.example .env.local      # NEXT_PUBLIC_API_MODE=mock, NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
npx msw init public             # only if public/mockServiceWorker.js is missing
npm run dev
```

- **Mock mode (default)**: all API calls are answered by the MSW handlers in `src/mocks/`, with data kept in the browser's local storage. Sign in with `student1@example.invalid`, `manager1@example.invalid` or `admin@example.invalid` and the password `demo2026`. Use `__myhcmusMock.reset()` in the console to reset the data.
- **Real backend**: set `NEXT_PUBLIC_API_MODE=real` and point `NEXT_PUBLIC_API_BASE_URL` at the backend. No code changes are needed. Some operations still wait for backend agreement: see `specs/003-auth-dashboard-admin-users/docs-changes.md`.
- **API types**: run `npm run gen:api` after `docs/api/openapi.yaml` changes. It regenerates `src/types/openapi.gen.ts`.
- **Quality gates**: `npm run lint`, `npm run test` and `npm run build`.

## Getting Started (Next.js template)

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
