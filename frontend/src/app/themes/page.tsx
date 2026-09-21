import type { Metadata } from "next";
import ThemeStorePage from "@/views/ThemeStorePage";

export const metadata: Metadata = {
  title: "Theme Store — Exofe",
  description: "Browse storefront themes built by Exofe developers.",
};

export default function Page() {
  return <ThemeStorePage />;
}
