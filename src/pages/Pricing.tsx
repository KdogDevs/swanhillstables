import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const boardingOptions = [
  {
    name: "Run-In / Outdoor Board",
    price: "$500",
    period: "/month",
    description: "Outdoor living with run-in shelter access.",
    features: [
      "24/7 pasture access with run-in shelter",
      "Daily feeding (2x/day)",
      "Fresh water always available",
      "Weekly health checks",
      "Basic fly control",
    ],
  },
  {
    name: "Stall Board",
    price: "$800",
    period: "/month",
    description: "Premium stall boarding with personalized daily care.",
    features: [
      "12x12 matted stall",
      "Daily turnout (weather permitting)",
      "Feeding (2x/day) with quality hay & grain",
      "Daily stall cleaning",
      "Access to all facilities",
      "Owner tack locker",
    ],
    featured: true,
  },
];

const lessonOptions = [
  {
    name: "Private Lesson",
    price: "$50",
    period: "/session",
    description: "One-on-one instruction tailored to your goals.",
    duration: "60 minutes",
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-24">
        {/* Page Header */}
        <section className="py-20 section-gradient">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <p className="text-accent text-sm uppercase tracking-[0.2em] mb-4 font-medium">
                Transparent Pricing
              </p>
              <h1 className="font-serif text-5xl md:text-6xl font-semibold text-foreground mb-6">
                Programs & Pricing
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Quality care and instruction at fair prices. Choose the program 
                that's right for you and your horse.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Boarding Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-serif text-4xl font-semibold text-foreground mb-4">
                Boarding Options
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                From outdoor run-in to full-service stall boarding, we have options 
                to fit every horse and budget.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {boardingOptions.map((option, index) => (
                <motion.div
                  key={option.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`relative rounded-xl p-8 transition-all duration-300 hover:card-shadow-hover ${
                    option.featured
                      ? "bg-primary text-primary-foreground card-shadow-hover"
                      : "bg-card card-shadow"
                  }`}
                >
                  {option.featured && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-accent text-accent-foreground text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h3 className="font-serif text-2xl font-semibold mb-2">
                      {option.name}
                    </h3>
                    <p className={`text-sm mb-4 ${option.featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {option.description}
                    </p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="font-serif text-4xl font-semibold">{option.price}</span>
                      <span className={option.featured ? "text-primary-foreground/70" : "text-muted-foreground"}>
                        {option.period}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {option.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${option.featured ? "text-accent" : "text-primary"}`} />
                        <span className={`text-sm ${option.featured ? "text-primary-foreground/90" : "text-foreground"}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={option.featured ? "hero" : "default"}
                    className="w-full"
                    size="lg"
                  >
                    Get Started
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Lessons Section */}
        <section className="py-20 bg-secondary">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-serif text-4xl font-semibold text-foreground mb-4">
                Riding Lessons
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                From first-time riders to seasoned competitors, our certified instructors 
                will help you reach your goals.
              </p>
            </motion.div>

            <div className="max-w-md mx-auto">
              {lessonOptions.map((lesson, index) => (
                <motion.div
                  key={lesson.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-card rounded-xl p-8 card-shadow hover:card-shadow-hover transition-all duration-300 text-center"
                >
                  <h3 className="font-serif text-2xl font-semibold text-foreground mb-2">
                    {lesson.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    {lesson.description}
                  </p>
                  <div className="flex items-baseline gap-1 justify-center mb-2">
                    <span className="font-serif text-4xl font-semibold text-foreground">{lesson.price}</span>
                    <span className="text-muted-foreground text-sm">{lesson.period}</span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-6">{lesson.duration}</p>
                  <Button variant="default" size="lg" className="w-full" asChild>
                    <Link to="/lessons">Book a Lesson</Link>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;