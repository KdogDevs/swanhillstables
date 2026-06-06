import { motion } from "framer-motion";
import { Phone, Mail, ExternalLink, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import zaxbysLogo from "@/assets/zaxbys-logo.jpeg";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// ... keep existing code (icon components + socialProfiles array unchanged)
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

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

const socialProfiles = [
  {
    platform: "Instagram",
    icon: InstagramIcon,
    handle: "@swan.hill.stables",
    name: "Swan Hill Stables",
    followers: "1.2K",
    description: "Premium horse boarding & riding lessons in Northport, AL",
    profileImage: zaxbysLogo,
    url: "https://www.instagram.com/swan.hill.stables?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
    gradient: "from-purple-500 via-pink-500 to-orange-400",
    buttonColor: "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:from-purple-600 hover:via-pink-600 hover:to-orange-500",
  },
  {
    platform: "Facebook",
    icon: FacebookIcon,
    handle: "Zaxbys",
    name: "Zaxby's",
    followers: "2.1M",
    description: "Indescribably Good Chicken™ | Official Page",
    profileImage: zaxbysLogo,
    url: "https://facebook.com/zaxbys",
    gradient: "from-blue-600 to-blue-400",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
  },
  {
    platform: "TikTok",
    icon: TikTokIcon,
    handle: "@zaxbys",
    name: "Zaxby's",
    followers: "892K",
    description: "Chicken content 🐔",
    profileImage: zaxbysLogo,
    url: "https://tiktok.com/@zaxbys",
    gradient: "from-gray-900 via-gray-800 to-black",
    buttonColor: "bg-black hover:bg-gray-900",
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
  const [igData, setIgData] = useState<{
    profilePic: string | null;
    followers: string;
    fullName: string;
    biography: string;
    isVerified: boolean;
    loading: boolean;
  }>({
    profilePic: null,
    followers: "—",
    fullName: "Swan Hill Stables",
    biography: "Premium horse boarding & riding lessons in Northport, AL",
    isVerified: false,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("instagram-profile", {
          body: { username: "swan.hill.stables" },
          method: "GET",
        });
        // supabase.functions.invoke doesn't support GET query params cleanly; fall back to direct fetch
        if (error || !data) throw error || new Error("no data");
        if (cancelled) return;
        setIgData({
          profilePic: data.profilePic ?? null,
          followers: data.followerCountFormatted ?? "—",
          fullName: data.fullName || "Swan Hill Stables",
          biography: data.biography || "Premium horse boarding & riding lessons in Northport, AL",
          isVerified: !!data.isVerified,
          loading: false,
        });
      } catch {
        // Fallback to direct GET against the function URL
        try {
          const projectId = (import.meta as any).env.VITE_SUPABASE_PROJECT_ID;
          const anon = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;
          const res = await fetch(
            `https://${projectId}.supabase.co/functions/v1/instagram-profile?username=swan.hill.stables`,
            { headers: { apikey: anon, Authorization: `Bearer ${anon}` } },
          );
          const data = await res.json();
          if (cancelled) return;
          if (data && !data.error) {
            setIgData({
              profilePic: data.profilePic ?? null,
              followers: data.followerCountFormatted ?? "—",
              fullName: data.fullName || "Swan Hill Stables",
              biography: data.biography || "Premium horse boarding & riding lessons in Northport, AL",
              isVerified: !!data.isVerified,
              loading: false,
            });
            return;
          }
        } catch {}
        if (!cancelled) setIgData((s) => ({ ...s, loading: false }));
      }
    };
    load();
    const interval = setInterval(load, 5 * 60 * 1000); // refresh every 5 min
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

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
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {socialProfiles.map((profile) => {
              const isInstagram = profile.platform === "Instagram";
              const displayName = isInstagram ? igData.fullName : profile.name;
              const displayBio = isInstagram ? igData.biography : profile.description;
              const displayFollowers = isInstagram
                ? igData.loading
                  ? "…"
                  : igData.followers
                : profile.followers;
              const displayPic =
                isInstagram && igData.profilePic ? igData.profilePic : profile.profileImage;
              const isVerified = isInstagram ? igData.isVerified : true;

              return (
                <motion.div key={profile.platform} variants={cardVariants}>
                  <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
                    <div className="relative h-24 overflow-hidden">
                      {isInstagram && igData.profilePic ? (
                        <>
                          <img
                            src={igData.profilePic}
                            alt=""
                            aria-hidden
                            className="absolute inset-0 w-full h-full object-cover scale-125 blur-xl"
                          />
                          <div className={`absolute inset-0 bg-gradient-to-r ${profile.gradient} opacity-60 mix-blend-overlay`} />
                        </>
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-r ${profile.gradient}`} />
                      )}
                      <div className="absolute top-3 right-3 text-white drop-shadow">
                        <profile.icon />
                      </div>
                      {isInstagram && !igData.loading && (
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur px-2 py-0.5 text-[10px] font-medium text-white">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                          Live
                        </div>
                      )}
                    </div>

                    <CardContent className="pt-0 relative">
                      <div className="absolute -top-10 left-4">
                        <div className="w-20 h-20 rounded-full border-4 border-card overflow-hidden shadow-lg bg-muted">
                          <img
                            src={displayPic}
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      <div className="pt-12 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-foreground">{displayName}</h3>
                          {isVerified && (
                            <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-500 fill-current">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                            </svg>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{profile.handle}</p>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {displayBio}
                        </p>
                        <p className="text-sm font-medium text-foreground mb-4">
                          {displayFollowers} followers
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
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
