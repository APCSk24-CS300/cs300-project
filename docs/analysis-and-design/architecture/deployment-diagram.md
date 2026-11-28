# myHCMUS Deployment Diagram

**Worker:** Quách Thiên Lạc  
**Reviewer(s):** Phạm Vân Trang  
**Editor(s):** Quách Thiên Lạc

**Version:** 2.0.0  
**Amendment:** 28/11/2026

---

## Deployment Diagram

```mermaid
flowchart LR
    user["User<br/>(Person)"]

    subgraph vercel["Application Hosting<br/>(Vercel)"]
        direction LR
        web["Frontend Application<br/>(Container: Next.js 16 / React 19 / TypeScript)"]
        api["Backend REST API<br/>(Container: Node.js 22 / Express 5 / TypeScript)"]
        web -->|"REST / JSON / HTTPS"| api
    end

    subgraph databaseHost["Managed Database<br/>(Supabase / Vercel Marketplace)"]
        direction TB
        db[("Database<br/>(Container: PostgreSQL 18 + pgvector)")]
    end

    university["University Services<br/>(External linked websites)"]
    ai["External AI API<br/>(Google Gemini)"]
    notifications["External Service<br/>(Planned: notification provider TBD)"]

    user -->|"HTTPS"| web
    web -.->|"HTTPS hyperlinks"| university
    api -->|"PostgreSQL / TLS"| db
    api -->|"REST / JSON / HTTPS"| ai
    api -.->|"Notifications"| notifications

    classDef person fill:#E8F1FD,stroke:#2864A0,color:#18385B,stroke-width:1.5px;
    classDef component fill:#176B91,stroke:#104D68,color:#FFFFFF,stroke-width:1.5px;
    classDef database fill:#D9EEF7,stroke:#176B91,color:#18385B,stroke-width:1.5px;
    classDef external fill:#EDF0F2,stroke:#64748B,color:#263445,stroke-width:1.5px;

    class user person;
    class web,api component;
    class db database;
    class university,ai,notifications external;
    style vercel fill:#F8FAFC,stroke:#64748B,stroke-width:1.5px,color:#263445;
    style databaseHost fill:#F8FAFC,stroke:#64748B,stroke-width:1.5px,color:#263445;
```

The diagram shows the target Vercel deployment for myHCMUS. Users access the Next.js application over HTTPS. Vercel hosts the frontend and the Express backend API within the application hosting boundary. The backend is packaged as a Docker/OCI container and deployed through Vercel Functions; API requests use REST with JSON over HTTPS. Vercel routes requests to the container's internal HTTP port **8080** through its `PORT` environment variable.

The API connects to the provider-managed PostgreSQL database over TLS through a pooled endpoint. The database is provisioned through a Vercel Marketplace integration, with its connection string supplied to the API through environment variables. Docker Compose and its database volume remain part of local development.

The backend calls Google Gemini through its REST API for AI assistant requests. The notification service is shown as planned, with its provider still to be selected. University Services are reached through HTTPS hyperlinks only; they are not direct API or database integrations.
