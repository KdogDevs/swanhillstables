import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  User, 
  Phone, 
  MapPin, 
  AlertCircle,
  Calendar,
  CreditCard,
  Bell,
  Settings,
  ChevronRight,
  Home,
  Stethoscope,
  Pencil
} from "lucide-react";
import { Link } from "react-router-dom";
import ProfileEditDialog from "@/components/ProfileEditDialog";

interface Profile {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  secondary_emergency_contact_name: string | null;
  secondary_emergency_contact_phone: string | null;
  preferred_vet_name: string | null;
  preferred_vet_phone: string | null;
  preferred_farrier_name: string | null;
  preferred_farrier_phone: string | null;
  is_boarder: boolean;
}

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(data as Profile | null);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const getInitials = (name: string | null) => {
    if (!name) return user.email?.charAt(0).toUpperCase() || "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const quickActions = [
    { icon: Calendar, label: "Book Lesson", description: "Schedule your next riding session", href: "/lessons" },
    { icon: CreditCard, label: "View Invoices", description: "Check billing and payment history", href: "#" },
    { icon: Bell, label: "Notifications", description: "View updates and announcements", href: "#" },
    { icon: Settings, label: "Account Settings", description: "Manage your profile and preferences", href: "#" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
          <h1 className="font-serif text-xl font-semibold text-foreground">Member Portal</h1>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Welcome Section */}
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border-2 border-border">
              <AvatarImage src={profile?.avatar_url || user.user_metadata?.avatar_url} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {getInitials(profile?.full_name || user.user_metadata?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-serif text-3xl font-semibold text-foreground">
                Welcome back, {profile?.full_name?.split(" ")[0] || user.user_metadata?.full_name?.split(" ")[0] || "Member"}!
              </h2>
              <p className="text-muted-foreground mt-1">
                Manage your boarding, lessons, and account details
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Profile Card */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Profile Information
                </CardTitle>
                <CardDescription>Your personal and contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">{profile?.full_name || user.user_metadata?.full_name || "Not set"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Phone
                    </p>
                    <p className="font-medium">{profile?.phone || "Not set"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Address
                    </p>
                    <p className="font-medium">{profile?.address || "Not set"}</p>
                  </div>
                </div>

                <Separator />

                {/* Primary Emergency Contact */}
                <div>
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-accent" />
                    Primary Emergency Contact
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Contact Name</p>
                      <p className="font-medium">{profile?.emergency_contact_name || "Not set"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Contact Phone</p>
                      <p className="font-medium">{profile?.emergency_contact_phone || "Not set"}</p>
                    </div>
                  </div>
                </div>

                {/* Secondary Emergency Contact */}
                <div>
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    Secondary Emergency Contact
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Contact Name</p>
                      <p className="font-medium">{profile?.secondary_emergency_contact_name || "Not set"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Contact Phone</p>
                      <p className="font-medium">{profile?.secondary_emergency_contact_phone || "Not set"}</p>
                    </div>
                  </div>
                </div>

                {/* Horse Care Preferences - Only for Boarders */}
                {profile?.is_boarder && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
                        <Stethoscope className="h-4 w-4 text-primary" />
                        Horse Care Preferences
                      </h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Preferred Vet</p>
                          <p className="font-medium">
                            {profile?.preferred_vet_name || "Not set"}
                            {profile?.preferred_vet_phone && (
                              <span className="text-muted-foreground text-sm ml-2">
                                ({profile.preferred_vet_phone})
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Preferred Farrier</p>
                          <p className="font-medium">
                            {profile?.preferred_farrier_name || "Not set"}
                            {profile?.preferred_farrier_phone && (
                              <span className="text-muted-foreground text-sm ml-2">
                                ({profile.preferred_farrier_phone})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Button variant="outline" className="mt-4" onClick={() => setEditDialogOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    to={action.href}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{action.label}</p>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <ProfileEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        profile={profile}
        onProfileUpdated={fetchProfile}
      />
    </div>
  );
};

export default Dashboard;
