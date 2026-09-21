"use client";

import { useEffect, useRef } from "react";
import { loadGoogleScript, type GoogleCredentialResponse } from "@/lib/google";

// Renders Google's own Sign-In button (via Google Identity Services) into
// a container we control the width/spacing of. Google owns the button's
// visuals on purpose — that's what keeps this flow trustworthy to users
// and reliable across browsers, a custom-styled button that fakes the
// click is a much easier thing to get subtly wrong.
export default function GoogleSignInButton({
  onCredential,
  text = "continue_with",
  iconOnly = false,
}: {
  onCredential: (idToken: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  // Compact circular icon, no label — for rows of same-sized provider
  // buttons (WhatsApp/Google/Facebook side by side) where Google's usual
  // wide labeled button would throw off the layout. Still Google's own
  // rendered button under the hood, just their "icon" display mode.
  iconOnly?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  useEffect(() => {
    onCredentialRef.current = onCredential;
  });

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const container = containerRef.current;
    if (!clientId || !container) return;

    let cancelled = false;

    loadGoogleScript().then(() => {
      if (cancelled || !window.google || !container) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: GoogleCredentialResponse) => onCredentialRef.current(response.credential),
      });

      window.google.accounts.id.renderButton(
        container,
        iconOnly
          ? { type: "icon", theme: "outline", size: "large", shape: "circle" }
          : { type: "standard", theme: "outline", size: "large", shape: "rectangular", text, width: container.offsetWidth || 320 }
      );
    });

    return () => {
      cancelled = true;
    };
  }, [text, iconOnly]);

  return (
    <div
      ref={containerRef}
      // GSI measures this element's own box to size its iframe — with no
      // intrinsic size (flex child, no content yet) that measurement reads
      // 0x0 and the iframe renders invisible. "large" icon mode renders at
      // 40px, so give it that explicitly rather than relying on a parent's
      // sizing to be in effect by the time Google's script measures it.
      className={iconOnly ? "flex h-10 w-10 items-center justify-center" : "flex w-full justify-center overflow-hidden [&>div]:!w-full"}
    />
  );
}
