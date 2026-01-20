import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import team1 from "@/assets/team-1.jpg";
import lendyPhoto from "@/assets/lendy-johnston.jpg";
import team3 from "@/assets/team-3.jpg";

const teamMembers = [
  {
    name: "Nicole Barry",
    role: "Owner & Trainer",
    image: team1,
    bio: "Nicole is a recent graduate of the University of Alabama with a passion for horses and teaching. As the owner of Swan Hill Stables, she brings fresh energy and dedication to creating a welcoming environment for riders of all skill levels.",
    credentials: ["University of Alabama Graduate", "Trainer", "Owner"],
  },
  {
    name: "Lendy Johnston",
    role: "Trainer",
    image: lendyPhoto,
    bio: "Lendy is a junior at the University of Alabama who brings enthusiasm and skill to every lesson. Her patience and attention to detail help students build confidence and develop their riding abilities.",
    credentials: ["University of Alabama Junior", "Trainer"],
  },
  {
    name: "Sarah Figeritti",
    role: "Trainer",
    image: team3,
    bio: "Sarah is a recent graduate of the University of Alabama with a deep love for equestrian sports. Her experience and dedication make her an invaluable part of our training team.",
    credentials: ["University of Alabama Graduate", "Trainer"],
  },
  {
    name: "Kagen Jensen",
    role: "Farm Hand & Trainer",
    image: team1,
    bio: "Kagen is a freshman at the University of Alabama who wears many hats at Swan Hill Stables. As both a farm hand and trainer, he helps keep operations running smoothly while sharing his love of horses with students.",
    credentials: ["University of Alabama Freshman", "Farm Hand", "Trainer"],
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
