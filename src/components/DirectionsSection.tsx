import { motion } from "framer-motion";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

const ADDRESS = "5808 Harper Rd, Northport, Alabama";
const ENCODED_ADDRESS = encodeURIComponent(ADDRESS);

export const DirectionsSection = () => {
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${ENCODED_ADDRESS}`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${ENCODED_ADDRESS}`;
  const embedUrl = `https://www.google.com/maps?q=${ENCODED_ADDRESS}&output=embed`;

  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-foreground mb-4">
            Find Us
          </h2>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <MapPin className="h-5 w-5 text-accent" />
            <p>{ADDRESS}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="aspect-video rounded-lg overflow-hidden card-shadow mb-8">
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Swan Hill Stables Location"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="gap-2"
            >
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                <Navigation className="h-5 w-5" />
                Get Directions (Google Maps)
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="gap-2"
            >
              <a href={appleMapsUrl} target="_blank" rel="noopener noreferrer">
                <Navigation className="h-5 w-5" />
                Get Directions (Apple Maps)
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
