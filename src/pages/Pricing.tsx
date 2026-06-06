import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Check, Home, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BoardingSignupWizard } from "@/components/boarding-signup/BoardingSignupWizard";
import { Tier, TIER_INCLUDES, TIER_AVAILABILITY, PRICE_MATRIX, FEED_LABELS, FeedPlan, ADDON_NOTES } from "@/components/boarding-signup/pricing";

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
  const [wizardTier, setWizardTier] = useState<Tier | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const startWizard = (tier?: Tier) => {
    setWizardTier(tier ?? null);
    setWizardOpen(true);
  };

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

        {/* Boarding tiers */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-6">
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
                Three tiers, five feed plans — pick what fits your horse and
                budget. Pricing scales with the feed plan you select.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {tierCards.map((card, index) => {
                const Icon = card.icon;
                const startPrice = PRICE_MATRIX[card.tier].boarder;
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
                        Starting at
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="font-serif text-4xl font-semibold">${startPrice}</span>
                        <span className={card.featured ? "text-primary-foreground/70" : "text-muted-foreground"}>/month</span>
                      </div>
                      <p className={`text-xs mt-1 ${card.featured ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        when you provide feed
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
                      onClick={() => startWizard(card.tier)}
                    >
                      Apply for {card.name}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Full pricing matrix */}
        <section className="py-16 bg-secondary/40">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-5xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="font-serif text-3xl font-semibold text-foreground mb-3">
                  Full Pricing Matrix
                </h2>
                <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
                  Feed options provided by the barn: <em>Tucker Milling non-GMO 14% Starch
                  Maintenance Pellets</em> or <em>Triple Crown Gold Senior Performance Pellets</em>.
                </p>
              </div>

              <div className="overflow-x-auto bg-card rounded-xl card-shadow">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-medium text-muted-foreground">Feed Plan</th>
                      <th className="text-right p-4 font-medium text-foreground">Indoor Stall</th>
                      <th className="text-right p-4 font-medium text-foreground">Outdoor / Shed-Row</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(FEED_LABELS) as FeedPlan[]).map((fp, idx) => (
                      <tr key={fp} className={idx % 2 ? "bg-muted/20" : ""}>
                        <td className="p-4 text-foreground">{FEED_LABELS[fp]}</td>
                        <td className="p-4 text-right font-semibold">${PRICE_MATRIX.indoor[fp]}</td>
                        <td className="p-4 text-right font-semibold">${PRICE_MATRIX.outdoor[fp]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="bg-card rounded-lg p-6 card-shadow">
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-3">
                    Available Add-Ons
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong className="text-foreground">Hay</strong> — $100/month</li>
                    <li>• <strong className="text-foreground">Pelletized bedding</strong> — $60/month</li>
                    {ADDON_NOTES.map((note) => (
                      <li key={note}>• {note}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-card rounded-lg p-6 card-shadow">
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-3">
                    What's Included in Every Tier
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Feeding twice daily</li>
                    <li>• Arena access</li>
                    <li>• Trail access (outdoor & pasture)</li>
                    <li>• Stall cleaning as needed (indoor & outdoor)</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-4 italic">
                    Board does <strong>not</strong> include training, grooming, blanketing, holding for
                    vet/farrier, or administering medications unless specifically requested.
                  </p>
                </div>
              </div>

              <div className="text-center mt-10">
                <Button size="lg" onClick={() => startWizard()}>
                  <FileText className="h-4 w-4 mr-2" />
                  Apply for Boarding
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  6-step wizard auto-fills the official Horse Boarding Agreement and emails you a signed copy.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Lessons Section */}
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

      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Boarding Application</DialogTitle>
          </DialogHeader>
          <BoardingSignupWizard
            initialTier={wizardTier ?? undefined}
            onClose={() => setWizardOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pricing;
