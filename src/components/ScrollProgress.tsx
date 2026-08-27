"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { useLenis } from "lenis/react";

export default function ScrollProgress() {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const lenis = useLenis();

  const scrollToPointer = (clientY: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const fraction = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const target = fraction * maxScroll;
    if (lenis) lenis.scrollTo(target, { immediate: false });
    else window.scrollTo({ top: target, behavior: "smooth" });
  };

  return (
    <div
      ref={trackRef}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        scrollToPointer(e.clientY);
      }}
      onPointerMove={(e) => {
        if (e.buttons !== 1) return;
        scrollToPointer(e.clientY);
      }}
      className="fixed right-4 top-1/2 z-40 hidden h-56 w-1.5 -translate-y-1/2 cursor-grab touch-none rounded-full bg-black/10 active:cursor-grabbing sm:right-6 sm:block"
    >
      <motion.div
        style={{ scaleY }}
        className="pointer-events-none absolute inset-x-0 top-0 h-full origin-top rounded-full bg-[#45157b]"
      />
    </div>
  );
}
