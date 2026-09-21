import Link from "next/link";

export default function BrandLogo({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-icon.png" alt="" className="h-8 w-auto" />
      <span className={`text-xl font-bold tracking-tight ${dark ? "text-white" : "text-foreground"}`}>Exofe</span>
    </Link>
  );
}
