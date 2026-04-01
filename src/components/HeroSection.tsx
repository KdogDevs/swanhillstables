import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef } from "react";
import heroBarn from "@/assets/barn-entrance.jpg";
import logoFull from "@/assets/logo-full-transparent.png";

// Preload hero image immediately
const preloadLink = document.createElement("link");
preloadLink.rel = "preload";
preloadLink.as = "image";
preloadLink.href = heroBarn;
document.head.appendChild(preloadLink);

export const HeroSection = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.5], [0, -60]);

  return (
    <section
      ref={ref}
      className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden"
    >
      {/* Parallax Background Image - GPU accelerated */}
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{ y: backgroundY, translateZ: 0 }}
      >
        <img
          src={heroBarn}
          alt="Swan Hill Stables at sunset"
          className="w-full h-[130%] object-cover"
          fetchPriority="high"
          decoding="async"
        />
        
      </motion.div>

      {/* Content with scroll fade - GPU accelerated */}
      <motion.div
        className="relative z-10 text-center px-6 max-w-4xl mx-auto will-change-transform"
        style={{ opacity: contentOpacity, y: contentY, translateZ: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center mb-8"
        >
          <img
            src={logoFull}
            alt="Swan Hill Stables"
            className="h-48 md:h-64 lg:h-72 w-auto rounded-md mix-blend-multiply"
            fetchPriority="high"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-primary-foreground/90 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Where horses thrive and riders grow. Experience exceptional boarding,
          expert lessons, and a welcoming community.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button variant="hero" size="xl" asChild>
            <Link to="/pricing">View Pricing</Link>
          </Button>
          <Button variant="hero-outline" size="xl" asChild>
            <Link to="/team">Meet Our Team</Link>
          </Button>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        style={{ opacity: contentOpacity }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-6 h-10 border-2 border-primary-foreground/50 rounded-full flex items-start justify-center p-2"
        >
          <div className="w-1.5 h-3 bg-primary-foreground/70 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
};
