import Hero from "@/components/Hero";
import Features from "@/components/Features";
import WhyChoose from "@/components/WhyChoose";
import GetStarted from "@/components/GetStarted";
import AIBusinessOS from "@/components/AIBusinessOS";
import OneCatalogEveryChannel from "@/components/OneCatalogEveryChannel";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <Features />
      <WhyChoose />
      <GetStarted />
      <AIBusinessOS />
      <OneCatalogEveryChannel />
      <Pricing />
      <FAQ />
      <CTA />
    </main>
  );
}
