import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { LessonInquiryForm } from "@/components/lesson-signup/LessonInquiryForm";
import { motion } from "framer-motion";
import { SEO } from "@/components/SEO";

const Lessons = () => {
  return (
    <div className="min-h-screen">
      <SEO
        title="Riding Lessons | Swan Hill Stables"
        description="Book private riding lessons at Swan Hill Stables. Personalized instruction for all ages and skill levels in a welcoming, professional environment."
        path="/lessons"
      />
      <Navigation />
      
      <main className="pt-24">
        <section className="py-10 md:py-16 section-gradient">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <p className="text-accent text-sm uppercase tracking-[0.2em] mb-4 font-medium">
                Get Started
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-6">
                Riding Lessons
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Send us a quick note and we'll get back to you to set up your first
                lesson and go over everything you need to know.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-10 md:py-16 bg-background">
          <div className="container mx-auto px-4 sm:px-6 max-w-2xl">
            <LessonInquiryForm />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Lessons;
