import type { Metadata } from "next";
import DevelopersLandingPage from "@/views/DevelopersLandingPage";

export const metadata: Metadata = {
  title: "Developers — Exofe",
  description: "Connect your storefront or app to Exofe. Sync products and shipping settings with a simple REST API.",
};

export default function Page() {
  return <DevelopersLandingPage />;
}
