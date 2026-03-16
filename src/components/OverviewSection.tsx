import { motion } from "framer-motion";
import horsePortrait from "@/assets/horse-portrait.jpg";

const features = [
  {
    title: "Boarding",
    description:
      "Spacious stalls with daily turnout, quality feed, and personalized care for each horse.",
  },
  {
    title: "Instruction",
    description:
      "Lessons from beginner to advanced with one of our 4 experienced trainers.",
  },
  {
    title: "Facilities",
    description:
      "Indoor arena and outdoor ring for year-round riding in any weather.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export const OverviewSection = () => {
  return (
    <section className="py-24 section-gradient">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image Side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true, margin: "-100px" }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-lg overflow-hidden card-shadow">
              <img
                src={horsePortrait}
                alt="Beautiful horse at Swan Hill Stables"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="absolute -bottom-6 -right-6 w-48 h-48 border-2 border-accent rounded-lg -z-10"
            />
          </motion.div>

          {/* Content Side */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <h2 className="font-serif text-4xl md:text-5xl font-semibold text-foreground mb-6">
                About Our Barn
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-10">
                Swan Hill Stables offers quality boarding and instruction for
                horses and riders of all levels. We're dedicated to exceptional
                care and a welcoming environment for everyone.
              </p>
            </motion.div>

            <motion.div
              className="grid sm:grid-cols-2 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              {features.map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  className="group"
                >
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
