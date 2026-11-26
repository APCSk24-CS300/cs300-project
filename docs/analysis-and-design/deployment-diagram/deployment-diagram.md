# myHCMUS Deployment Diagram

**Worker:** Quách Thiên Lạc  
**Reviewer(s):** Phạm Vân Trang 
**Editor(s):** Quách Thiên Lạc

**Version:** 2.0.0  
**Amendment:** 26/11/2026

---

```mermaid
%%{init: {"theme": "base", "themeVariables": {"fontFamily": "Arial, sans-serif", "background": "#ffffff"}, "c4": {"diagramMarginX": 90, "diagramMarginY": 20, "c4ShapeMargin": 50, "c4ShapePadding": 16, "messageFontSize": 14, "messageFontFamily": "Arial, sans-serif"}, "themeCSS": "text[dominant-baseline=\"middle\"] { paint-order: stroke; stroke: #ffffff; stroke-width: 5px; stroke-linejoin: round; }"}}%%
C4Deployment
    title Deployment Diagram for myHCMUS

    %% Target deployment: Next.js and a Docker/OCI-packaged API run on Vercel.
    %% PostgreSQL is provisioned through a Vercel Marketplace integration.
    %% Docker Compose remains the local development environment.

    Deployment_Node(device, "User device", "Desktop or mobile") {
        Deployment_Node(browser, "Web browser", "Chrome / Firefox / Safari / Edge") {
            Container(client, "myHCMUS client", "React 19/ TypeScript (NextJS client bundle)", "Student, activity manager, and administrator UI")
        }
    }

    Deployment_Node(vercel, "Application hosting", "Vercel") {
        Container(web, "Next.js web application", "Next.js 16 / React 19 / TypeScript", "Serves pages and static assets;<br/>runs server-side code")
        Deployment_Node(serverContainer, "myHCMUS-server", "Vercel Functions / OCI container") {
            Container(api, "Backend API", "Node.js 22 / Express 5 / TypeScript", "Containerized HTTP service;<br/>public HTTPS endpoint routed to `PORT=8080`")
        }
    }

    Deployment_Node(databaseHost, "Managed database", "Supabase / Vercel Marketplace") {
        ContainerDb(db, "Application database", "Managed PostgreSQL", "Pooled connection endpoint;<br/>provider-managed persistent storage")
    }

    Deployment_Node(externalServices, "External services", "Third-party providers") {
        Container(emailService, "Email Service", "Email provider API (Gmail/Outlook)", "Sends notifications")
        Container(aiService, "AI Service", "AI model provider API (Gemini/GPT)", "Sends user queries")
    }

    Rel(client, web, "Loads pages and sends API requests", "HTTPS")
    Rel(web, api, "Forwards API requests", "REST / JSON over HTTPS :443")
    Rel(api, db, "Reads and writes data", "PostgreSQL / TLS (pooled)")
    Rel(api, emailService, "Sends notifications", "HTTPS / JSON")
    Rel(api, aiService, "Sends user questions", "Gemini REST / JSON over HTTPS :443")

    %% Blue: browser UI; amber: Vercel frontend; teal: containerized API;
    %% violet: managed database.
    UpdateElementStyle(client, $bgColor="#DBEAFE", $fontColor="#172554", $borderColor="#2563EB")
    UpdateElementStyle(web, $bgColor="#FEF3C7", $fontColor="#78350F", $borderColor="#D97706")
    UpdateElementStyle(api, $bgColor="#CCFBF1", $fontColor="#134E4A", $borderColor="#0D9488")
    UpdateElementStyle(db, $bgColor="#EDE9FE", $fontColor="#4C1D95", $borderColor="#7C3AED")

    UpdateRelStyle(client, web, $textColor="#92400E", $lineColor="#D97706", $offsetX="-45", $offsetY="-45")
    UpdateRelStyle(web, api, $textColor="#475569", $lineColor="#64748B", $offsetX="0", $offsetY="0")
    UpdateRelStyle(api, db, $textColor="#115E59", $lineColor="#0D9488", $offsetX="110", $offsetY="30")

    UpdateElementStyle(emailService, $bgColor="#F1F5F9", $fontColor="#1E293B", $borderColor="#64748B")
    UpdateElementStyle(aiService, $bgColor="#F1F5F9", $fontColor="#1E293B", $borderColor="#64748B")
    UpdateRelStyle(api, emailService, $textColor="#475569", $lineColor="#64748B", $offsetX="280", $offsetY="-60")
    UpdateRelStyle(api, aiService, $textColor="#475569", $lineColor="#64748B", $offsetX="40", $offsetY="15")

    UpdateLayoutConfig($c4ShapeInRow="1", $c4BoundaryInRow="4")
```

The diagram shows the target Vercel deployment for myHCMUS. Users access the React and TypeScript interface through a web browser. Vercel hosts the Next.js application and serves pages and static assets over HTTPS.

The Express API is packaged as a Docker/OCI container and deployed on Vercel Functions using the container runtime. API requests follow **client → Next.js web application → backend API**. The client sends requests to the Next.js frontend over HTTPS, and Next.js forwards them to the Express backend using REST requests with JSON payloads over **HTTPS on port 443** (default port). Vercel routes these requests to the container's internal HTTP port **8080** (default port is **80** but can be explicitly set with Vercel's `PORT` environment variable).

The **API → database** connection uses the `pg` driver over **TLS** through a pooled PostgreSQL endpoint. The database is provisioned through a Vercel Marketplace integration, with its connection string supplied to the API through environment variables. The database provider manages persistent storage. Docker Compose and its database volume remain part of local development.

External services include email services accessed through providers such as Gmail or Outlook, which the application uses to send notifications to users, and AI services, which are accessed via an MCP client, to power the in-app chatbot (models are yet to be decided and will be chosen in the next sprint).

References: [Docker deployments on Vercel](https://vercel.com/kb/guide/does-vercel-support-docker-deployments), [Postgres on Vercel](https://vercel.com/docs/postgres), and [Marketplace storage integrations](https://vercel.com/docs/marketplace-storage).
