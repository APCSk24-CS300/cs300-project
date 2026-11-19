# myHCMUS Deployment Diagram

**Worker:** Quách Thiên Lạc  
**Reviewer(s):** Phạm Vân Trang 
**Editor(s):** Quách Thiên Lạc

**Version:** 1.0.0  
**Amendment:** 19/11/2026

---

![myHCMUS deployment diagram](deployment-diagram.svg)

The diagram shows how myHCMUS is deployed across the user's device, Vercel, and a separate Docker host. Users access the React and TypeScript interface through a web browser. Vercel hosts the Next.js application, serving pages and static assets over HTTPS and executing server-side code.

On the separate host, Docker Compose manages two containers: an Express API running on Node.js 22 at port **8080**, and a PostgreSQL 18 database reachable by the API at **db:5432**. The API reads and writes application data using the `pg` driver. Database files are stored in the `myHCMUS-db` named volume, mounted at `/var/lib/postgresql`, so they persist when the database container is recreated.

The browser-to-API connection represents planned integration through REST requests with JSON payloads. The current frontend still uses mock authentication and defaults to mock activity data; Vercel hosting is assumed for this deployment view.
