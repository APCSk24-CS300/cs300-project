import { AdminServiceLinks } from "@/features/services/admin/components/AdminServiceLinks";

export const metadata = { title: "Service links | myHCMUS admin" };

/** Administration of University Services Hub links (BR-ADM-01). The API checks hub.services.manage. */
export default function AdminServiceLinksPage() {
  return <AdminServiceLinks />;
}
