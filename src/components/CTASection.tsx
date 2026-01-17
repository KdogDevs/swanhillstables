import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="py-24 bg-primary">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-primary-foreground mb-6">
            Begin Your Journey
            <span className="italic block mt-2">With Us</span>
          </h2>
          <p className="text-primary-foreground/80 text-lg leading-relaxed mb-10">
            Whether you're looking for exceptional boarding, professional lessons, 
            or a welcoming community, Willow Creek Stables is ready to welcome you home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" asChild>
              <Link to="/pricing" className="gap-2">
                Explore Our Programs
                <ArrowRight size={18} />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
