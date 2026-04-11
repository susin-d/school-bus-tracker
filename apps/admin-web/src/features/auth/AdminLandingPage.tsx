import { useEffect, useState } from "react";

import FeaturesGrid from "@/components/features-grid";
import FinalCTA from "@/components/final-cta";
import Footer from "@/components/footer";
import Hero from "@/components/hero";
import HowItWorks from "@/components/how-it-works";
import MetricsStrip from "@/components/metrics-strip";
import Navbar from "@/components/navbar";
import Pricing from "@/components/pricing";
import ProductPreview from "@/components/product-preview";
import SocialProof from "@/components/social-proof";

export function AdminLandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-[#fff4e8]">
      <Navbar />
      <Hero />
      <MetricsStrip />
      <SocialProof />
      <FeaturesGrid />
      <HowItWorks />
      <ProductPreview />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}
