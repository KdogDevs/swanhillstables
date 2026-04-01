import { motion } from "framer-motion";
import barnEntrance from "@/assets/barn-entrance.jpg";
import creekFencing from "@/assets/creek-fencing.jpg";
import indoorArena from "@/assets/indoor-arena.jpg";
import stallsExterior from "@/assets/stalls-exterior.jpg";
import paddockHorses from "@/assets/paddock-horses.jpg";
import ridingField from "@/assets/riding-field.jpg";

const galleryImages = [
  {
    src: barnEntrance,
    alt: "Swan Hill Stables barn entrance at golden hour",
    span: "col-span-2 row-span-2",
  },
  {
    src: indoorArena,
    alt: "Spacious indoor riding arena",
    span: "col-span-1 row-span-1",
  },
  {
    src: stallsExterior,
    alt: "Covered stalls and barn exterior",
    span: "col-span-1 row-span-1",
  },
  {
    src: creekFencing,
    alt: "Property creek and wooden fencing with treeline",
    span: "col-span-1 row-span-1",
  },
  {
    src: paddockHorses,
    alt: "Horses grazing in the paddock at dusk",
    span: "col-span-1 row-span-1",
  },
  {
    src: ridingField,
    alt: "Open riding field surrounded by trees",
    span: "col-span-2 row-span-1",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const imageVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export const GallerySection = () => {
  return (
    <section className="py-24 bg-secondary">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <p className="text-accent text-sm uppercase tracking-[0.2em] mb-4 font-medium">
            Our Facilities
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-foreground">
            Take a Look Around
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px] md:auto-rows-[250px]"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {galleryImages.map((image, index) => (
            <motion.div
              key={index}
              variants={imageVariants}
              className={`${image.span} rounded-lg overflow-hidden group cursor-pointer`}
            >
              <div className="relative w-full h-full">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-300" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
