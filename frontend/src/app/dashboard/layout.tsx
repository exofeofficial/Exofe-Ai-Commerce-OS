"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import BottomNav from "@/components/dashboard/BottomNav";
import MoreSheet from "@/components/dashboard/MoreSheet";
import PendingTasksWidget from "@/components/dashboard/PendingTasksWidget";
import TrialLockOverlay from "@/components/dashboard/TrialLockOverlay";
import ThemeProvider from "@/components/dashboard/ThemeProvider";
import DashboardLoader from "@/components/dashboard/DashboardLoader";
import { getToken } from "@/lib/auth";
import { getOnboardingStatus, getTrialStatus, type OnboardingStatus } from "@/lib/api";
import { buildOnboardingTasks, type TrialStatus } from "@/lib/trial";

// Fail-open default: if the trial-status fetch errors out (a network
// hiccup, the backend being briefly down), don't lock a paying customer
// out of their own dashboard over it.
const SAFE_DEFAULT_TRIAL: TrialStatus = {
  isTrialing: true,
  daysLeft: 7,
  trialLengthDays: 7,
  isExpired: false,
  currentPlan: "trial",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [trial, setTrial] = useState<TrialStatus>(SAFE_DEFAULT_TRIAL);
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    getTrialStatus()
      .then(setTrial)
      .catch(() => {})
      .finally(() => setChecked(true));
    getOnboardingStatus()
      .then(setOnboarding)
      .catch(() => {});
  }, [router]);

  // close the mobile drawer whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!checked) {
    return (
      <ThemeProvider>
        <DashboardLoader />
      </ThemeProvider>
    );
  }

  const isBillingPage = pathname === "/dashboard/billing";
  const showLock = trial.isExpired && !isBillingPage;

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-background">
        {/* Topbar and Sidebar are both `fixed` (viewport-relative, not part
            of this flow) — only this main column's own page content scrolls,
            they stay put regardless of scroll position. */}
        <Topbar />
        <Sidebar trial={trial} />

        <main className="mt-16 min-h-[calc(100vh-4rem)] rounded-t-2xl bg-[#f7f4fc] dark:bg-background sm:rounded-t-3xl lg:ml-64">
          <div className="p-4 pb-24 sm:p-6 lg:pb-6">{children}</div>
        </main>

        <BottomNav onMoreClick={() => setMobileOpen(true)} />
        <MoreSheet open={mobileOpen} onClose={() => setMobileOpen(false)} />

        {!showLock && <PendingTasksWidget trial={trial} tasks={buildOnboardingTasks(onboarding)} />}
        {showLock && <TrialLockOverlay trial={trial} />}
      </div>
    </ThemeProvider>
  );
}
