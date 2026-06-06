import { motion } from "framer-motion";
import { Phone, Mail, ExternalLink, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const socialProfiles = [
  {
    platform: "Instagram",
    icon: InstagramIcon,
    handle: "@swan.hill.stables",
    name: "Swan Hill Stables",
    followers: "",
    description: "Premium horse boarding & riding lessons in Northport, AL",
    url: "https://www.instagram.com/swan.hill.stables?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
    gradient: "from-purple-500 via-pink-500 to-orange-400",
    buttonColor: "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:from-purple-600 hover:via-pink-600 hover:to-orange-500",
  },
  {
    platform: "Facebook",
    icon: FacebookIcon,
    handle: "Swan Hill Stables",
    name: "Swan Hill Stables",
    followers: "",
    description: "Premium horse boarding & riding lessons in Northport, AL",
    url: "https://facebook.com/swanhillstables",
    gradient: "from-blue-600 to-blue-400",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

export const ContactSection = () => {
  return (
    <section id="contact" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Get in Touch
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Reach out via phone, email, or follow us on social media.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          {/* Contact Info */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
          >
            <motion.div variants={cardVariants} className="flex-1 max-w-sm mx-auto sm:mx-0">
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <a
                      href="tel:+16175137262"
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                    >
                      +1 (617) 513-7262
                    </a>
                    <div className="flex items-center gap-3 mt-1">
                      <a
                        href="sms:+16175137262"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <MessageSquare className="h-3 w-3" />
                        Send a message
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={cardVariants} className="flex-1 max-w-sm mx-auto sm:mx-0">
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a
                      href="mailto:stables@swanhillstables.com"
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                    >
                      stables@swanhillstables.com
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Social Profile Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <p className="text-muted-foreground">Follow us on social media</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {socialProfiles.map((profile) => (
              <motion.div key={profile.platform} variants={cardVariants}>
                <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
                  <div className="relative h-24">
                    <div className={`absolute inset-0 bg-gradient-to-r ${profile.gradient}`} />
                    <div className="absolute top-3 right-3 text-white/90">
                      <profile.icon />
                    </div>
                  </div>

                  <CardContent className="pt-0 relative">
                    <div className="absolute -top-10 left-4">
                      <div className="w-20 h-20 rounded-full border-4 border-card overflow-hidden shadow-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <profile.icon />
                      </div>
                    </div>

                    <div className="pt-12 pb-4">
                      <h3 className="font-bold text-foreground mb-1">{profile.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{profile.handle}</p>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {profile.description}
                      </p>

                      <a href={profile.url} target="_blank" rel="noopener noreferrer" className="block">
                        <Button className={`w-full ${profile.buttonColor} text-white gap-2`}>
                          Follow
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
