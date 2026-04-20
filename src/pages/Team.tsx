import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import nicolePhoto from "@/assets/nicole-barry.jpg";
import lendyPhoto from "@/assets/lendy-johnston.jpg";
import kagenPhoto from "@/assets/kagen-jensen.jpg";

const teamMembers = [
  {
    name: "Nicole Barry",
    role: "Owner & Trainer",
    image: nicolePhoto,
    bio: "Nicole is a dedicated horsewoman and instructor with 19 years of hands-on experience in the equine industry. As the owner of Swan Hill Stables, she has worked under several trainers as both an instructor and barn manager, gaining extensive knowledge in horse care, rider development, and barn operations. Nicole also has experience starting young horses and finishing them for successful riding careers, bringing skill, patience, and a welcoming approach to riders of all levels.",
    credentials: ["Owner", "Trainer", "19 Years Experience"],
  },
  {
    name: "Lendy Johnston",
    role: "Farm Hand & Trainer",
    image: lendyPhoto,
    bio: "Lendy brings enthusiasm and skill to every lesson. Her patience and attention to detail help students build confidence and develop their riding abilities.",
    credentials: ["Farm Hand", "Trainer"],
  },
  {
    name: "Kagen Jensen",
    role: "Farm Foreman",
    image: kagenPhoto,
    bio: "Kagen wears many hats at Swan Hill Stables. As farm foreman, he helps keep operations running smoothly while sharing his love of horses with students.",
    credentials: ["Farm Foreman"],
  },
];

const Team = () => {
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
                The People Behind The Barn
              </p>
              <h1 className="font-serif text-5xl md:text-6xl font-semibold text-foreground mb-6">
                Meet Our Team
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Passionate professionals dedicated to the care of your horses 
                and the growth of every rider who walks through our gates.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Team Members */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-6">
            <div className="space-y-24">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className={`grid lg:grid-cols-2 gap-12 items-center ${
                    index % 2 === 1 ? "lg:grid-flow-dense" : ""
                  }`}
                >
                  {/* Image */}
                  <div className={index % 2 === 1 ? "lg:col-start-2" : ""}>
                    <div className="relative">
                      <div className="aspect-[4/5] rounded-xl overflow-hidden card-shadow">
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Decorative element */}
                      <div className={`absolute -bottom-6 ${index % 2 === 1 ? "-left-6" : "-right-6"} w-48 h-48 border-2 border-accent rounded-xl -z-10`} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className={index % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""}>
                    <p className="text-accent text-sm uppercase tracking-[0.2em] mb-2 font-medium">
                      {member.role}
                    </p>
                    <h2 className="font-serif text-4xl font-semibold text-foreground mb-6">
                      {member.name}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-8">
                      {member.bio}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {member.credentials.map((credential) => (
                        <span
                          key={credential}
                          className="bg-secondary text-secondary-foreground text-sm px-4 py-2 rounded-full"
                        >
                          {credential}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Join Our Team CTA */}
        <section className="py-20 bg-secondary">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center max-w-2xl mx-auto"
            >
              <h2 className="font-serif text-4xl font-semibold text-foreground mb-6">
                Join Our Family
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                We're always looking for passionate individuals who share our love 
                for horses and commitment to excellence. Whether you're an experienced 
                trainer or just starting your equestrian career, we'd love to hear from you.
              </p>
              <a 
                href="mailto:careers@swanhillstables.com"
                className="inline-block bg-primary text-primary-foreground font-medium px-8 py-3 rounded-md hover:bg-primary/90 transition-colors"
              >
                Get in Touch
              </a>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Team;
