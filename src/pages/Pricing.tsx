import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Check, Home, Sparkles, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, lazy, Suspense } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// Waitlist form is only needed once the user clicks — lazy-load its bundle then.
const BoardingWaitlistForm = lazy(() =>
  import("@/components/boarding-signup/BoardingWaitlistForm").then((m) => ({
    default: m.BoardingWaitlistForm,
  }))
);
import { Tier, TIER_INCLUDES, TIER_AVAILABILITY, BASE_BOARD_PRICE } from "@/components/boarding-signup/pricing";

const lessonOptions = [
  {
    name: "Private Lesson",
    price: "$50",
    period: "/session",
    description: "One-on-one instruction tailored to your goals.",
    duration: "1 hour",
  },
];

const tierCards: Array<{
  tier: Tier;
  name: string;
  icon: typeof Home;
  description: string;
  featured?: boolean;
}> = [
  {
    tier: "outdoor",
    name: "Outdoor / Shed-Row Stall",
    icon: Home,
    description: "Covered 11x12 bedded stall with arena and trail access.",
    featured: true,
  },
  {
    tier: "indoor",
    name: "Indoor Stall",
    icon: Sparkles,
    description: "Premium 10x10 indoor stall with full arena access.",
  },
];

const Pricing = () => {
  const [waitlistTier, setWaitlistTier] = useState<Tier | null>(null);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  const startWaitlist = (tier?: Tier) => {
    setWaitlistTier(tier ?? null);
    setWaitlistOpen(true);
  };

  return (
    <div className="min-h-screen">
      <SEO
        title="Horse Boarding Pricing | Swan Hill Stables"
        description="Transparent horse boarding pricing at Swan Hill Stables. Indoor and outdoor stall options with arena access, expert care, and flexible add-ons."
        path="/pricing"
      />
      <Navigation />

      <main className="pt-24">
        {/* Page Header */}
        <section className="py-12 md:py-20 section-gradient">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <p className="text-accent text-sm uppercase tracking-[0.2em] mb-4 font-medium">
                Transparent Pricing
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-6">
                Programs & Pricing
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Quality care and instruction at fair prices. Choose the program
                that's right for you and your horse.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Boarding tiers */}
        <section className="py-12 md:py-20 bg-background">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12 max-w-2xl mx-auto"
            >
              <h2 className="font-serif text-4xl font-semibold text-foreground mb-4">
                Boarding Tiers
              </h2>
              <p className="text-muted-foreground">
                Choose an indoor or outdoor stall. Feed is not sold in tiers—it is
                charged separately and prorated using the current price of the feed
                we stock and the amount your horse consumes.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {tierCards.map((card, index) => {
                const Icon = card.icon;
                const basePrice = BASE_BOARD_PRICE[card.tier];
                return (
                  <motion.div
                    key={card.tier}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className={`relative rounded-xl p-8 transition-all duration-300 hover:card-shadow-hover flex flex-col ${
                      card.featured
                        ? "bg-primary text-primary-foreground card-shadow-hover"
                        : "bg-card card-shadow"
                    }`}
                  >
                    {card.featured && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="bg-accent text-accent-foreground text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <Icon className={`h-8 w-8 mb-3 ${card.featured ? "text-accent" : "text-primary"}`} />
                    <h3 className="font-serif text-2xl font-semibold mb-1">{card.name}</h3>
                    <p className={`text-xs mb-4 ${card.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {TIER_AVAILABILITY[card.tier]}
                    </p>
                    <p className={`text-sm mb-6 ${card.featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {card.description}
                    </p>

                    <div className="mb-6">
                      <p className={`text-xs uppercase tracking-wide mb-1 ${card.featured ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        Base board
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="font-serif text-4xl font-semibold">${basePrice}</span>
                        <span className={card.featured ? "text-primary-foreground/70" : "text-muted-foreground"}>/month</span>
                      </div>
                      <p className={`text-xs mt-1 ${card.featured ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        plus prorated feed cost, if barn-provided
                      </p>
                    </div>

                    <ul className="space-y-2 mb-6 flex-1">
                      {TIER_INCLUDES[card.tier].map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${card.featured ? "text-accent" : "text-primary"}`} />
                          <span className={`text-sm ${card.featured ? "text-primary-foreground/90" : "text-foreground"}`}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={card.featured ? "hero" : "default"}
                      className="w-full"
                      size="lg"
                      onClick={() => startWaitlist(card.tier)}
                    >
                      Join Waiting List
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Boarding price breakdown */}
        <section className="py-10 md:py-16 bg-secondary/40">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-5xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="font-serif text-3xl font-semibold text-foreground mb-3">
                  Boarding Price Breakdown
                </h2>
                <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
                  Board has one base rate for each stall type. If we provide feed, its cost is
                  added separately and <strong>prorated from the feed's current purchase price</strong>
                  based on the amount your horse consumes. There are no fixed feed tiers.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-card rounded-lg p-6 card-shadow">
                  <p className="text-sm text-muted-foreground mb-1">Indoor Stall Base</p>
                  <p className="font-serif text-3xl font-semibold text-foreground">${BASE_BOARD_PRICE.indoor}<span className="font-sans text-sm font-normal text-muted-foreground">/month</span></p>
                </div>
                <div className="bg-card rounded-lg p-6 card-shadow">
                  <p className="text-sm text-muted-foreground mb-1">Outdoor / Shed-Row Base</p>
                  <p className="font-serif text-3xl font-semibold text-foreground">${BASE_BOARD_PRICE.outdoor}<span className="font-sans text-sm font-normal text-muted-foreground">/month</span></p>
                </div>
                <div className="sm:col-span-2 bg-card rounded-lg p-6 card-shadow">
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Feed</h3>
                  <p className="text-sm text-muted-foreground">
                    Boarders may provide their own feed. Barn-provided feed is billed at its
                    current cost, prorated to the amount consumed by each horse.
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <div className="bg-card rounded-lg p-6 card-shadow">
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-3">
                    What's Included in Every Tier
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Feeding twice daily</li>
                    <li>• Arena access</li>
                    <li>• Trail access</li>
                    <li>• Stall cleaning as needed (indoor & outdoor)</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-4 italic">
                    Board does <strong>not</strong> include training, grooming, blanketing, holding for
                    vet/farrier, or administering medications unless specifically requested.
                  </p>
                </div>
              </div>

              <div className="text-center mt-10">
                <Button size="lg" onClick={() => startWaitlist()}>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Join the Boarding Waiting List
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Tell us your name, contact info, and how many horses you have — we'll reach out when a stall opens.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Lessons Section */}
        <section className="py-12 md:py-20 bg-background">
          <div className="container mx-auto px-4 sm:px-6">
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
                From first-time riders to seasoned competitors, our certified
                instructors will help you reach your goals.
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
                  <div className="p-4 rounded-lg bg-secondary border border-border mb-6">
                    <p className="text-sm font-medium text-foreground">Pay via Venmo</p>
                    <p className="text-muted-foreground text-sm">
                      Send payment to{" "}
                      <a
                        href="https://venmo.com/swanhillstables?txn=pay&amount=50&note=Riding%20Lesson"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary hover:underline"
                      >
                        @swanhillstables
                      </a>
                    </p>
                  </div>
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

      <Dialog open={waitlistOpen} onOpenChange={setWaitlistOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Boarding Waiting List</DialogTitle>
          </DialogHeader>
          {waitlistOpen && (
            <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Loading…</div>}>
              <BoardingWaitlistForm
                initialTier={waitlistTier ?? undefined}
                onClose={() => setWaitlistOpen(false)}
              />
            </Suspense>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pricing;
