import "@/app/globals.css";
import { RoleNav } from "@/components/layout/RoleNav";
import { Container } from "@/components/ui/Container";
import { AdminServiceLinks } from "@/features/services/admin/components/AdminServiceLinks";

export const metadata = { title: "Service links | myHCMUS admin" };

/** Administration of University Services Hub links. proxy.ts admits the admin role only; the API checks hub.services.manage. */
export default function AdminServiceLinksPage() {
  return (
    <>
      <RoleNav />
      <main id="main" className="py-10">
        <Container>
          <AdminServiceLinks />
        </Container>
      </main>
    </>
  );
}
