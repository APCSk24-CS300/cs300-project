import type { Metadata } from "next";
import { LandingPage } from "@/features/landing";
import { LANDING_METADATA } from "@/features/landing/metadata";

export const metadata: Metadata = LANDING_METADATA;

export default function PublicHomePage() {
  return <LandingPage />;
}
