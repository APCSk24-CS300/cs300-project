import { cn } from "@/libs/cn";

type SectionHeaderProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center" | "split";
  tone?: "light" | "dark";
  className?: string;
};

export function SectionHeader({
  id,
  eyebrow,
  title,
  description,
  align = "left",
  tone = "light",
  className,
}: SectionHeaderProps) {
  const titleNode = (
    <h2
      id={id}
      className={cn(
        "text-3xl font-bold leading-tight tracking-tight md:text-4xl",
        tone === "dark" ? "text-white" : "text-text",
      )}
    >
      {title}
    </h2>
  );

  const eyebrowNode = eyebrow ? (
    <p
      className={cn(
        "mb-3 text-sm font-semibold uppercase tracking-[0.14em]",
        tone === "dark" ? "text-white/75" : "text-primary",
      )}
    >
      {eyebrow}
    </p>
  ) : null;

  if (align === "split") {
    return (
      <div
        className={cn(
          "grid gap-5 lg:grid-cols-2 lg:items-end",
          className,
        )}
      >
        <div>
          {eyebrowNode}
          {titleNode}
        </div>
        {description ? (
          <p
            className={cn(
              "max-w-md text-sm leading-6 lg:justify-self-end",
              tone === "dark" ? "text-white/80" : "text-text-muted",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrowNode}
      {titleNode}
      {description ? (
        <p
          className={cn(
            "mt-3 text-sm leading-6",
            tone === "dark" ? "text-white/80" : "text-text-muted",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
