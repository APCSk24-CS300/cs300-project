import { z } from "zod";

// Same rules as the backend (src/server/src/helper/validateServiceLinkRequest.ts).
export const NAME_MAX = 100;
export const URL_MAX = 2048;
export const DESCRIPTION_MAX = 500;
export const DISPLAY_ORDER_MAX = 9999;

function isSafeServiceUrl(url: string): boolean {
  if (url.length === 0 || url.length > URL_MAX || /\s/.test(url)) return false;
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      parsed.hostname !== "" &&
      parsed.username === "" &&
      parsed.password === ""
    );
  } catch {
    return false;
  }
}

/** Form values (strings as typed). `toServiceLinkPayload` turns them into the API body. */
export const ServiceLinkFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a name")
    .max(NAME_MAX, `Use at most ${NAME_MAX} characters`),
  url: z
    .string()
    .trim()
    .min(1, "Enter the service address")
    .max(URL_MAX, `Use at most ${URL_MAX} characters`)
    .refine((v) => v === "" || isSafeServiceUrl(v), "Use a full http:// or https:// address"),
  description: z.string().trim().max(DESCRIPTION_MAX, `Use at most ${DESCRIPTION_MAX} characters`),
  displayOrder: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d+$/.test(v), "Order must be a whole number")
    .refine((v) => v === "" || Number(v) <= DISPLAY_ORDER_MAX, `Order must be between 0 and ${DISPLAY_ORDER_MAX}`),
  isActive: z.boolean(),
});

export type ServiceLinkFormValues = z.input<typeof ServiceLinkFormSchema>;

export const EMPTY_SERVICE_LINK_FORM: ServiceLinkFormValues = {
  name: "",
  url: "",
  description: "",
  displayOrder: "",
  isActive: true,
};

/** API body from parsed form values. An empty order is left out so the backend puts the link last. */
export function toServiceLinkPayload(values: z.output<typeof ServiceLinkFormSchema>) {
  return {
    name: values.name,
    url: values.url,
    description: values.description === "" ? null : values.description,
    ...(values.displayOrder === "" ? {} : { displayOrder: Number(values.displayOrder) }),
    isActive: values.isActive,
  };
}
