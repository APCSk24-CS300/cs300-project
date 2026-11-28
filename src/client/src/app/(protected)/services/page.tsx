import "@/app/globals.css";
import { RoleNav } from "@/components/layout/RoleNav";
import { Container } from "@/components/ui/Container";
import { HUB_CONTENT, ServiceHub } from "@/features/services";

export const metadata = { title: `${HUB_CONTENT.title} | myHCMUS` };

/** University Services Hub (UC-07). proxy.ts lets every signed-in role in and sends guests to login. */
export default function UniversityServicesPage() {
  return (
    <>
      <RoleNav />
      <main id="main" className="py-10">
        <Container>
          <h1 className="text-3xl font-bold text-text">{HUB_CONTENT.title}</h1>
          <p className="mt-2 max-w-2xl text-text-muted">{HUB_CONTENT.description}</p>
          <div className="mt-8">
            <ServiceHub />
          </div>
        </Container>
      </main>
    </>
  );
}
