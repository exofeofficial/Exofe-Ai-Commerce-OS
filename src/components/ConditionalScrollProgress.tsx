"use client";

import { usePathname } from "next/navigation";
import ScrollProgress from "@/components/ScrollProgress";
import { HIDDEN_CHROME_ROUTES } from "@/lib/hidden-chrome-routes";

export default function ConditionalScrollProgress() {
  const pathname = usePathname();

  if (HIDDEN_CHROME_ROUTES.some((route) => pathname?.startsWith(route))) {
    return null;
  }

  return <ScrollProgress />;
}
