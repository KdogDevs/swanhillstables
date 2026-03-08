import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { LessonSignupWizard } from "@/components/lesson-signup/LessonSignupWizard";
import { motion } from "framer-motion";

const Lessons = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-24">
        <section className="py-16 section-gradient">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <p className="text-accent text-sm uppercase tracking-[0.2em] mb-4 font-medium">
                Get Started
              </p>
              <h1 className="font-serif text-5xl md:text-6xl font-semibold text-foreground mb-6">
                Riding Lessons
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Complete the application below to get started. You'll create an account,
                review our barn rules, and sign the required documents — all in one place.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-6 max-w-2xl">
            <LessonSignupWizard />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Lessons;
