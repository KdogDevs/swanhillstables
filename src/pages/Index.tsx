import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { lazy, Suspense } from "react";
import { Footer } from "@/components/Footer";

// Lazy load below-fold sections
const OverviewSection = lazy(() => import("@/components/OverviewSection").then(m => ({ default: m.OverviewSection })));
const GallerySection = lazy(() => import("@/components/GallerySection").then(m => ({ default: m.GallerySection })));
const DirectionsSection = lazy(() => import("@/components/DirectionsSection").then(m => ({ default: m.DirectionsSection })));
const ContactSection = lazy(() => import("@/components/ContactSection").then(m => ({ default: m.ContactSection })));
const CTASection = lazy(() => import("@/components/CTASection").then(m => ({ default: m.CTASection })));

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <HeroSection />
        <Suspense fallback={<div className="min-h-[200px]" />}>
          <OverviewSection />
          <GallerySection />
          <DirectionsSection />
          <ContactSection />
          <CTASection />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
