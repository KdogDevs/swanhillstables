import { useEffect, lazy, Suspense } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "@/assets/logo-transparent.png";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
// Each admin tab is a heavy module (forms, dialogs, editors). Lazy-load per tab so
// the initial admin bundle is tiny and only the active tab's code is downloaded.
const AdminClientsList  = lazy(() => import("@/components/admin/AdminClientsList").then(m => ({ default: m.AdminClientsList })));
const AdminDocuments    = lazy(() => import("@/components/admin/AdminDocuments").then(m => ({ default: m.AdminDocuments })));
const AdminCareLog      = lazy(() => import("@/components/admin/AdminCareLog").then(m => ({ default: m.AdminCareLog })));
const AdminHorseUseLog  = lazy(() => import("@/components/admin/AdminHorseUseLog").then(m => ({ default: m.AdminHorseUseLog })));
const AdminEmail        = lazy(() => import("@/components/admin/AdminEmail").then(m => ({ default: m.AdminEmail })));
const AdminContacts     = lazy(() => import("@/components/admin/AdminContacts").then(m => ({ default: m.AdminContacts })));
const AdminMailingLists = lazy(() => import("@/components/admin/AdminMailingLists").then(m => ({ default: m.AdminMailingLists })));
const AdminSuperSettings= lazy(() => import("@/components/admin/AdminSuperSettings").then(m => ({ default: m.AdminSuperSettings })));
const AdminSupplyTracker= lazy(() => import("@/components/admin/AdminSupplyTracker").then(m => ({ default: m.AdminSupplyTracker })));
const AdminReceipts     = lazy(() => import("@/components/admin/AdminReceipts").then(m => ({ default: m.AdminReceipts })));
import {
  Loader2, Users, FileText, Home, LogOut,
  ClipboardList, Bookmark, Mail, Contact, Megaphone, Settings, Package, Receipt
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

  const TabFallback = () => (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

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
            <LogOut className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Sign Out</span>
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
              <TabsTrigger value="horseuse" className="flex items-center gap-1.5 text-xs">
                <Bookmark className="h-3.5 w-3.5" /> Horse Use
              </TabsTrigger>
              <TabsTrigger value="supplies" className="flex items-center gap-1.5 text-xs">
                <Package className="h-3.5 w-3.5" /> Supplies
              </TabsTrigger>
              <TabsTrigger value="receipts" className="flex items-center gap-1.5 text-xs">
                <Receipt className="h-3.5 w-3.5" /> Receipts
              </TabsTrigger>
              {isSuperAdmin && (
                <TabsTrigger value="settings" className="flex items-center gap-1.5 text-xs">
                  <Settings className="h-3.5 w-3.5" /> Settings
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="email"><Suspense fallback={<TabFallback />}><AdminEmail isSuperAdmin={isSuperAdmin} /></Suspense></TabsContent>
            <TabsContent value="contacts"><Suspense fallback={<TabFallback />}><AdminContacts /></Suspense></TabsContent>
            <TabsContent value="mailinglists"><Suspense fallback={<TabFallback />}><AdminMailingLists /></Suspense></TabsContent>
            <TabsContent value="clients"><Suspense fallback={<TabFallback />}><AdminClientsList /></Suspense></TabsContent>
            <TabsContent value="horseuse"><Suspense fallback={<TabFallback />}><AdminHorseUseLog /></Suspense></TabsContent>
            <TabsContent value="supplies"><Suspense fallback={<TabFallback />}><AdminSupplyTracker /></Suspense></TabsContent>
            <TabsContent value="receipts"><Suspense fallback={<TabFallback />}><AdminReceipts /></Suspense></TabsContent>
            {isSuperAdmin && (
              <TabsContent value="settings"><Suspense fallback={<TabFallback />}><AdminSuperSettings /></Suspense></TabsContent>
            )}
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminDashboard;
