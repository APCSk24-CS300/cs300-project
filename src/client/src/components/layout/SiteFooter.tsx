import { Container } from "@/components/ui/Container";
import { CopyrightYear } from "@/components/layout/CopyrightYear";
import { Logo } from "@/components/layout/Logo";
import type { FooterContent } from "@/types/site";

type SiteFooterProps = {
  content: FooterContent;
};

export function SiteFooter({ content }: SiteFooterProps) {
  return (
    <footer
      id="contact"
      aria-labelledby="footer-heading"
      className="scroll-mt-[calc(var(--header-height)+2rem)] bg-primary-dark text-white"
    >
      <h2 id="footer-heading" className="sr-only">
        Contact myHCMUS
      </h2>
      <Container className="grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo variant="light" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-white/75">
            {content.brandDescription}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/75">
            {content.contactHeading}
          </h3>
          <address className="mt-4 space-y-3 text-sm not-italic leading-6 text-white/85">
            <p>{content.address}</p>
            <p className="space-y-1">
              {content.phones.map((phone) => (
                <a
                  key={phone}
                  href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                  className="block underline-offset-4 hover:underline"
                >
                  {phone}
                </a>
              ))}
            </p>
            <a
              href={`mailto:${content.email}`}
              className="inline-block underline-offset-4 hover:underline"
            >
              {content.email}
            </a>
          </address>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/75">
            {content.quickLinksHeading}
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-white/85">
            {content.quickLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={link.href}
                  className="underline-offset-4 hover:underline"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/15">
        <Container className="py-5 text-xs text-white/70">
          © <CopyrightYear /> {content.copyrightLabel}
        </Container>
      </div>
    </footer>
  );
}
