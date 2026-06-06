import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "@/assets/logo-transparent.png";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { AdminClientsList } from "@/components/admin/AdminClientsList";
import { AdminDocuments } from "@/components/admin/AdminDocuments";
import { AdminCareLog } from "@/components/admin/AdminCareLog";
import { AdminHorseUseLog } from "@/components/admin/AdminHorseUseLog";
import { AdminEmail } from "@/components/admin/AdminEmail";
import { AdminContacts } from "@/components/admin/AdminContacts";
import { AdminMailingLists } from "@/components/admin/AdminMailingLists";
import { AdminSuperSettings } from "@/components/admin/AdminSuperSettings";
import { AdminSupplyTracker } from "@/components/admin/AdminSupplyTracker";
import { 
  Loader2, Users, FileText, Home, Shield, LogOut,
  ClipboardList, Bookmark, Mail, Contact, Megaphone, Settings, Package
} from "lucide-react";

const AdminDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, isSuperAdmin, isLoading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) navigate("/dashboard");
  }, [isAdmin, adminLoading, user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="hidden sm:flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Home className="h-4 w-4" /><span className="text-sm">Home</span>
            </Link>
            <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <span className="text-sm">Member Portal</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <img src={logo} alt="Swan Hill Stables" className="h-10 w-auto rounded-md" />
            <h1 className="font-serif text-xl font-semibold text-foreground">
              {isSuperAdmin ? "Super Admin" : "Admin"}
            </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground">Swan Hill Stables Admin</h2>
            <p className="text-muted-foreground mt-1">
              {isSuperAdmin ? "Full system control — manage accounts, roles, and all operations" : "Manage clients, paperwork, and lesson availability"}
            </p>
          </div>

          <Tabs defaultValue="email" className="space-y-6">
            <TabsList className="flex flex-wrap w-full max-w-full gap-1 h-auto p-1">
              <TabsTrigger value="email" className="flex items-center gap-1.5 text-xs">
                <Mail className="h-3.5 w-3.5" /> Email
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center gap-1.5 text-xs">
                <Contact className="h-3.5 w-3.5" /> Contacts
              </TabsTrigger>
              <TabsTrigger value="mailinglists" className="flex items-center gap-1.5 text-xs">
                <Megaphone className="h-3.5 w-3.5" /> Mailing Lists
              </TabsTrigger>
              <TabsTrigger value="clients" className="flex items-center gap-1.5 text-xs">
                <Users className="h-3.5 w-3.5" /> Clients
              </TabsTrigger>
              <TabsTrigger value="carelog" className="flex items-center gap-1.5 text-xs">
                <ClipboardList className="h-3.5 w-3.5" /> Care Log
              </TabsTrigger>
              <TabsTrigger value="horseuse" className="flex items-center gap-1.5 text-xs">
                <Bookmark className="h-3.5 w-3.5" /> Horse Use
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5" /> Paperwork
              </TabsTrigger>
              <TabsTrigger value="supplies" className="flex items-center gap-1.5 text-xs">
                <Package className="h-3.5 w-3.5" /> Supplies
              </TabsTrigger>
              {isSuperAdmin && (
                <TabsTrigger value="settings" className="flex items-center gap-1.5 text-xs">
                  <Settings className="h-3.5 w-3.5" /> Settings
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="email"><AdminEmail isSuperAdmin={isSuperAdmin} /></TabsContent>
            <TabsContent value="contacts"><AdminContacts /></TabsContent>
            <TabsContent value="mailinglists"><AdminMailingLists /></TabsContent>
            <TabsContent value="clients"><AdminClientsList /></TabsContent>
            <TabsContent value="carelog"><AdminCareLog /></TabsContent>
            <TabsContent value="horseuse"><AdminHorseUseLog /></TabsContent>
            <TabsContent value="documents"><AdminDocuments /></TabsContent>
            <TabsContent value="supplies"><AdminSupplyTracker /></TabsContent>
            {isSuperAdmin && (
              <TabsContent value="settings"><AdminSuperSettings /></TabsContent>
            )}
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminDashboard;
