import { PageHeader } from "@/components/layout/PageHeader";
import { HUB_CONTENT, ServiceHub } from "@/features/services";

export const metadata = { title: `${HUB_CONTENT.title} | myHCMUS` };

/** University Services Hub (UC-07), shared by every role; rendered inside the protected AppShell. */
export default function UniversityServicesPage() {
  return (
    <>
      <PageHeader title={HUB_CONTENT.title} description={HUB_CONTENT.description} />
      <ServiceHub />
    </>
  );
}
