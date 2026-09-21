"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, MailCheck } from "lucide-react";
import { ApiError, googleAuth, requestOtp, signUpWithProvider, verifyOtp } from "@/lib/api";
import { goToDashboard, setToken } from "@/lib/auth";
import { ensureUserProfile, setUserProfile } from "@/lib/user";
import { decodeGoogleIdToken } from "@/lib/google";
import { fbEvent } from "@/lib/fbpixel";
import BrandLogo from "@/components/BrandLogo";
import CodeInput from "@/components/ui/CodeInput";
import GoogleSignInButton from "@/components/GoogleSignInButton";

const EASE = [0.22, 1, 0.36, 1] as const;

function EmailStep({
  developer,
  email,
  emailError,
  isSending,
  onEmailChange,
  onSubmit,
  onGoogleCredential,
  onSocialClick,
  socialNotice,
}: {
  developer: boolean;
  email: string;
  emailError: string | null;
  isSending: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleCredential: (idToken: string) => void;
  onSocialClick: (provider: "whatsapp" | "facebook") => void;
  socialNotice: string | null;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#09090C] px-4 py-14">
      <BrandLogo dark className="mb-8" />

      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{developer ? "Create your developer account" : "Start your free trial"}</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="mt-8 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl sm:p-7"
      >
        <form onSubmit={onSubmit} noValidate>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="Email address"
            autoFocus
            disabled={isSending}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#45157b]/30 disabled:opacity-60 ${
              emailError ? "border-red-400" : "border-black/[.15]"
            }`}
          />
          {emailError && <p className="mt-1.5 text-xs text-red-500">{emailError}</p>}

          <button
            type="submit"
            disabled={isSending}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#45157b] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70"
          >
            {isSending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />}
            {isSending ? "Sending code..." : "Continue with email"}
          </button>
        </form>

        <div className="mt-5 flex items-center gap-3 text-xs text-foreground/40">
          <span className="h-px flex-1 bg-black/[.1]" />
          or
          <span className="h-px flex-1 bg-black/[.1]" />
        </div>

        <div className="mt-5 flex items-center justify-center gap-3">
          {/* This is a login/identity provider slot (like Google or
              Facebook), not the dashboard's own WhatsApp-Business
              connection — there's no such OAuth provider on the backend
              yet, hence the "not set up" fallback via onSocialClick. */}
          <button
            type="button"
            onClick={() => onSocialClick("whatsapp")}
            aria-label="Continue with WhatsApp"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-black/[.1] transition-colors hover:bg-black/[.03]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/I5.png" alt="" className="h-5 w-5 object-contain" />
          </button>

          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-black/[.1] transition-colors hover:bg-black/[.03]">
            <GoogleSignInButton onCredential={onGoogleCredential} iconOnly />
          </div>

          <button
            type="button"
            onClick={() => onSocialClick("facebook")}
            aria-label="Continue with Facebook"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-black/[.1] text-[#1877F2] transition-colors hover:bg-black/[.03]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07Z" />
            </svg>
          </button>
        </div>

        {socialNotice && <p className="mt-4 text-center text-xs text-amber-600">{socialNotice}</p>}

        <p className="mt-6 text-center text-sm text-foreground/55">
          Already have an Exofe account?{" "}
          <Link href={developer ? "/developer/login" : "/login"} className="font-semibold text-[#45157b] hover:underline">
            Log in
          </Link>
        </p>
      </motion.div>
    </main>
  );
}

export default function SignupPage({ developer = false }: { developer?: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "verify">("email");
  const [email, setEmail] = useState("");
  const [emailStepError, setEmailStepError] = useState<string | null>(null);
  const [otpStatus, setOtpStatus] = useState<"idle" | "loading">("idle");
  const [socialNotice, setSocialNotice] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "loading">("idle");
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const handleEmailStepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailStepError("Enter a valid email");
      return;
    }

    setEmailStepError(null);
    setOtpStatus("loading");
    try {
      await requestOtp(email);
      setOtpStatus("idle");
      setStep("verify");
    } catch (err) {
      setOtpStatus("idle");
      setEmailStepError(err instanceof ApiError ? err.message : "Couldn't send the code. Please try again.");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setVerifyError("Enter the 6-digit code");
      return;
    }

    setVerifyStatus("loading");
    setVerifyError(null);
    try {
      const { token } = await verifyOtp(email, code);
      setToken(token);
      ensureUserProfile(email);
      fbEvent("CompleteRegistration", { content_name: "Email Signup", status: true });
      goToDashboard(router);
    } catch (err) {
      setVerifyStatus("idle");
      setCode("");
      setVerifyError(err instanceof ApiError ? err.message : "That code didn't work. Please try again.");
    }
  };

  const handleGoogleCredential = async (idToken: string) => {
    setSocialNotice(null);
    try {
      const { token } = await googleAuth(idToken);
      // Google already verifies the email, so unlike the email/code flow
      // above there's no code-entry step — straight to the dashboard.
      setToken(token);
      const info = decodeGoogleIdToken(idToken);
      if (info) setUserProfile(info);
      fbEvent("CompleteRegistration", { content_name: "Google Signup", status: true });
      goToDashboard(router);
    } catch (err) {
      setSocialNotice(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  };

  const handleSocial = async (provider: "facebook" | "whatsapp") => {
    setSocialNotice(null);
    try {
      await signUpWithProvider(provider);
    } catch (err) {
      setSocialNotice(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  };

  if (step === "email") {
    return (
      <EmailStep
        developer={developer}
        email={email}
        emailError={emailStepError}
        isSending={otpStatus === "loading"}
        onEmailChange={(value) => {
          setEmail(value);
          if (emailStepError) setEmailStepError(null);
        }}
        onSubmit={handleEmailStepSubmit}
        onGoogleCredential={handleGoogleCredential}
        onSocialClick={handleSocial}
        socialNotice={socialNotice}
      />
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#09090C] px-4 py-14">
      <BrandLogo dark className="mb-8" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="bg-gradient-to-br from-[#45157b] to-[#4338CA] px-8 pb-8 pt-9 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur">
            <MailCheck className="h-7 w-7 text-white" strokeWidth={2} />
          </span>
          <h1 className="mt-4 text-xl font-bold text-white">Verify your email</h1>
          <p className="mt-1.5 text-sm text-white/70">
            Enter the 6-digit code we sent to
            <br />
            <span className="font-semibold text-white">{email}</span>
          </p>
        </div>

        <div className="px-8 py-8">
          <form onSubmit={handleVerify} noValidate className="flex flex-col items-center gap-5">
            <CodeInput
              value={code}
              onChange={(v) => {
                setCode(v);
                if (verifyError) setVerifyError(null);
              }}
              error={!!verifyError}
              disabled={verifyStatus === "loading"}
            />
            {verifyError && <p className="-mt-2 text-center text-xs font-medium text-red-500">{verifyError}</p>}

            <motion.button
              type="submit"
              disabled={verifyStatus === "loading" || code.length !== 6}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#45157b] py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/20 transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {verifyStatus === "loading" && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />}
              {verifyStatus === "loading" ? "Verifying..." : "Verify & Continue"}
            </motion.button>

            <button
              type="button"
              onClick={() => setStep("email")}
              className="text-center text-sm font-medium text-[#45157b] hover:underline"
            >
              Wrong email? Go back
            </button>
          </form>

          <p className="mt-5 text-center text-xs leading-relaxed text-foreground/45">
            Check your spam folder if the code hasn&apos;t arrived.
          </p>
        </div>
      </motion.div>
    </main>
  );
}
