import { motion } from "framer-motion";
import stallsImage from "@/assets/stalls.jpg";
import arenaImage from "@/assets/arena.jpg";
import heroImage from "@/assets/hero-barn.jpg";
import horsePortrait from "@/assets/horse-portrait.jpg";

const galleryImages = [
  {
    src: heroImage,
    alt: "Willow Creek Stables exterior at golden hour",
    span: "col-span-2 row-span-2",
  },
  {
    src: stallsImage,
    alt: "Clean, well-maintained horse stalls",
    span: "col-span-1 row-span-1",
  },
  {
    src: arenaImage,
    alt: "Outdoor riding arena with white fencing",
    span: "col-span-1 row-span-1",
  },
  {
    src: horsePortrait,
    alt: "Beautiful chestnut horse portrait",
    span: "col-span-2 row-span-1",
  },
];

export const GallerySection = () => {
  return (
    <section className="py-24 bg-secondary">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-accent text-sm uppercase tracking-[0.2em] mb-4 font-medium">
            Our Facilities
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-foreground">
            Take a Look Around
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px] md:auto-rows-[250px]">
          {galleryImages.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`${image.span} rounded-lg overflow-hidden group cursor-pointer`}
            >
              <div className="relative w-full h-full">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-300" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
