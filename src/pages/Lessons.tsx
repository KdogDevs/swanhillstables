import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { LessonCalendar } from "@/components/LessonCalendar";
import { motion } from "framer-motion";

const Lessons = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-24">
        {/* Page Header */}
        <section className="py-16 section-gradient">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <p className="text-accent text-sm uppercase tracking-[0.2em] mb-4 font-medium">
                Book Your Lesson
              </p>
              <h1 className="font-serif text-5xl md:text-6xl font-semibold text-foreground mb-6">
                Riding Lessons
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Browse available times and book your private lesson with our expert instructors.
                $40 per 60-minute session.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Calendar Section */}
        <section className="py-12 bg-background">
          <div className="container mx-auto px-6">
            <LessonCalendar />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Lessons;