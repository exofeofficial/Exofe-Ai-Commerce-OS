import { Suspense } from "react";
import type { Metadata } from "next";
import HomeWelcomePage from "@/views/dashboard/HomeWelcomePage";

export const metadata: Metadata = {
  title: "Home — Exofe",
};

export default function Page() {
  // HomeWelcomePage reads ?c=<id> via useSearchParams to resume a saved
  // conversation, which Next requires a Suspense boundary for.
  return (
    <Suspense fallback={null}>
      <HomeWelcomePage />
    </Suspense>
  );
}
