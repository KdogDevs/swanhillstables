import { motion } from "framer-motion";
import horsePortrait from "@/assets/horse-portrait.jpg";

const features = [
  {
    title: "Boarding",
    description: "Spacious stalls with daily turnout, quality feed, and personalized care for each horse.",
  },
  {
    title: "Instruction",
    description: "Lessons from beginner to advanced with one of our 4 experienced trainers.",
  },
  {
    title: "Facilities",
    description: "Indoor arena and outdoor ring for year-round riding in any weather.",
  },
];

export const OverviewSection = () => {
  return (
    <section className="py-24 section-gradient">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-lg overflow-hidden card-shadow">
              <img
                src={horsePortrait}
                alt="Beautiful horse at Swan Hill Stables"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-6 -right-6 w-48 h-48 border-2 border-accent rounded-lg -z-10" />
          </motion.div>

          {/* Content Side */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <p className="text-accent text-sm uppercase tracking-[0.2em] mb-4 font-medium">
                About Our Barn
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-semibold text-foreground mb-6">
                A Fresh Start
                <span className="italic block">Done Right</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-10">
                Swan Hill Stables is a new barn built with care and passion for horses 
                and riders of all ages. Our commitment to exceptional care and 
                professional training sets us apart.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
