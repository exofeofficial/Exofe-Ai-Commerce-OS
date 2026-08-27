import type { Metadata } from "next";
import HomeWelcomePage from "@/views/dashboard/HomeWelcomePage";

export const metadata: Metadata = {
  title: "Home — Exofe",
};

export default function Page() {
  return <HomeWelcomePage />;
}
