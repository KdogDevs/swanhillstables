import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const boardingOptions = [
  {
    name: "Pasture Board",
    price: "$400",
    period: "/month",
    description: "Full-time pasture living with daily monitoring and care.",
    features: [
      "24/7 pasture access",
      "Daily feeding (2x/day)",
      "Fresh water always available",
      "Weekly health checks",
      "Blanketing included",
      "Basic fly control",
    ],
  },
  {
    name: "Full Board",
    price: "$800",
    period: "/month",
    description: "Premium stall boarding with personalized daily care.",
    features: [
      "12x12 matted stall",
      "Daily turnout (weather permitting)",
      "Feeding (3x/day) with quality hay & grain",
      "Daily stall cleaning",
      "Blanketing & fly masks included",
      "Access to all facilities",
      "Owner tack locker",
    ],
    featured: true,
  },
  {
    name: "Training Board",
    price: "$1,400",
    period: "/month",
    description: "Full board plus professional training sessions.",
    features: [
      "Everything in Full Board",
      "4 training rides per week",
      "Monthly progress reports",
      "Show preparation",
      "Personalized training plan",
      "Priority scheduling",
    ],
  },
];

const lessonOptions = [
  {
    name: "Private Lesson",
    price: "$75",
    period: "/session",
    description: "One-on-one instruction tailored to your goals.",
    duration: "60 minutes",
  },
  {
    name: "Semi-Private",
    price: "$55",
    period: "/person",
    description: "Small group of 2 riders at similar skill levels.",
    duration: "60 minutes",
  },
  {
    name: "Group Lesson",
    price: "$45",
    period: "/person",
    description: "Learn with 3-4 riders in a supportive environment.",
    duration: "60 minutes",
  },
  {
    name: "Lesson Package",
    price: "$260",
    period: "/4 lessons",
    description: "Save with our popular 4-lesson bundle.",
    duration: "Private lessons",
    savings: "Save $40",
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
                From pasture to full-service training, we have boarding options 
                to fit every horse and budget.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {boardingOptions.map((option, index) => (
                <motion.div
                  key={option.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
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

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {lessonOptions.map((lesson, index) => (
                <motion.div
                  key={lesson.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-card rounded-xl p-6 card-shadow hover:card-shadow-hover transition-all duration-300"
                >
                  {lesson.savings && (
                    <span className="inline-block bg-accent/20 text-accent text-xs font-semibold px-3 py-1 rounded-full mb-4">
                      {lesson.savings}
                    </span>
                  )}
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                    {lesson.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {lesson.description}
                  </p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-serif text-3xl font-semibold text-foreground">{lesson.price}</span>
                    <span className="text-muted-foreground text-sm">{lesson.period}</span>
                  </div>
                  <p className="text-muted-foreground text-sm">{lesson.duration}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Button variant="default" size="xl">
                Book a Lesson
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
