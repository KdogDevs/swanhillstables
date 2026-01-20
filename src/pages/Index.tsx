import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { OverviewSection } from "@/components/OverviewSection";
import { GallerySection } from "@/components/GallerySection";
import { DirectionsSection } from "@/components/DirectionsSection";
import { ContactSection } from "@/components/ContactSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <HeroSection />
        <OverviewSection />
        <GallerySection />
        <DirectionsSection />
        <ContactSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
