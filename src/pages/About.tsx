import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import barnEntrance from "@/assets/barn-entrance.jpg";
import creekFencing from "@/assets/creek-fencing.jpg";
import indoorArena from "@/assets/indoor-arena.jpg";
import stallsExterior from "@/assets/stalls-exterior.jpg";
import paddockHorses from "@/assets/paddock-horses.jpg";
import horsesFence from "@/assets/horses-fence.jpg";
import ridingField from "@/assets/riding-field.jpg";
import { StallTour3D } from "@/components/StallTour3D";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } },
};

const About = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        {/* Hero Banner */}
        <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
          <img
            src={barnEntrance}
            alt="Swan Hill Stables barn entrance at golden hour"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-foreground/50" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 text-center px-6"
          >
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-4">
              About Swan Hill Stables
            </h1>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto">
              A place where horses thrive and riders grow
            </p>
          </motion.div>
        </section>

        {/* Our Story */}
        <section className="py-12 md:py-20 section-gradient">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeUp}
              >
                <p className="text-accent text-sm uppercase tracking-[0.2em] mb-4 font-medium">
                  Our Story
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground mb-6">
                  More Than a Barn
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Swan Hill Stables is a full-service equestrian facility offering quality boarding and 
                  instruction for horses and riders of all levels. Nestled in a beautiful wooded setting, 
                  our barn provides a peaceful and welcoming environment for everyone.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  We're dedicated to exceptional care for every horse in our barn and to helping riders 
                  develop their skills with confidence. Whether you're looking for a safe place to board 
                  your horse or wanting to learn to ride, Swan Hill Stables is the place for you.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="aspect-[4/3] rounded-lg overflow-hidden card-shadow">
                  <img
                    src={creekFencing}
                    alt="Creek running through the property with wooden fencing"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Facilities */}
        <section className="py-12 md:py-20 bg-secondary">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUp}
              className="text-center mb-16"
            >
              <p className="text-accent text-sm uppercase tracking-[0.2em] mb-4 font-medium">
                Our Facilities
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground">
                Everything Your Horse Needs
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Indoor Arena */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="aspect-[16/10] rounded-lg overflow-hidden mb-4 card-shadow">
                  <img
                    src={indoorArena}
                    alt="Indoor riding arena with sand footing"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground mb-2">Indoor Arena</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Our spacious indoor arena features quality sand footing and natural lighting, 
                  allowing year-round riding regardless of weather conditions.
                </p>
              </motion.div>

              {/* Stalls */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="aspect-[16/10] rounded-lg overflow-hidden mb-4 card-shadow">
                  <img
                    src={stallsExterior}
                    alt="Covered stall row with horses"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground mb-2">Covered Stalls</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Clean, well-maintained covered stalls provide shelter and comfort for every horse, 
                  with daily turnout and personalized care routines.
                </p>
              </motion.div>

              {/* Paddocks */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="aspect-[16/10] rounded-lg overflow-hidden mb-4 card-shadow">
                  <img
                    src={paddockHorses}
                    alt="Horses in turnout paddock"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground mb-2">Turnout Paddocks</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Multiple paddocks and pastures give horses plenty of room to move and socialize, 
                  surrounded by beautiful wooded scenery.
                </p>
              </motion.div>

              {/* Riding Field */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="aspect-[16/10] rounded-lg overflow-hidden mb-4 card-shadow">
                  <img
                    src={ridingField}
                    alt="Open outdoor riding field"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground mb-2">Outdoor Riding</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Our outdoor riding area is surrounded by lush greenery, perfect for lessons, 
                  trail rides, and enjoying the natural setting.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 3D Stall Tour */}
        <StallTour3D />

        {/* Property Overview */}
        <section className="py-12 md:py-20 section-gradient">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="aspect-[4/3] rounded-lg overflow-hidden card-shadow">
                  <img
                    src={horsesFence}
                    alt="Horses through wooden fence at Swan Hill Stables"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </motion.div>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeUp}
              >
                <p className="text-accent text-sm uppercase tracking-[0.2em] mb-4 font-medium">
                  Our Community
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground mb-6">
                  A Welcoming Barn Family
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  At Swan Hill Stables, we believe in building a supportive community of riders and 
                  horse lovers. Our experienced trainers work closely with each rider to develop 
                  skills and confidence at every level.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  From beginners taking their first lesson to experienced riders perfecting their 
                  technique, everyone is welcome here. Come visit us and see what makes Swan Hill 
                  Stables special.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
