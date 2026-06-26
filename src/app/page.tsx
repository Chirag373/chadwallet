import { Navbar } from "@/components/Navbar";
import { RotatingBanner } from "@/components/RotatingBanner";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Fixed navbar */}
      <Navbar />

      {/* Top ticker — directly under navbar */}
      <div className="pt-16">
        <RotatingBanner direction="left" />
      </div>

      {/* Hero section */}
      <Hero />

      {/* Bottom ticker — between hero and features */}
      <RotatingBanner direction="right" />

      {/* Feature bento grid */}
      <Features />

      {/* Bottom CTA */}
      <CTA />

      {/* Footer */}
      <Footer />
    </main>
  );
}
