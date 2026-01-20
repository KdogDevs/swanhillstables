import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { AdminClientsList } from "@/components/admin/AdminClientsList";
import { AdminDocuments } from "@/components/admin/AdminDocuments";
import { AdminLessonSlots } from "@/components/AdminLessonSlots";
import { AdminCareLog } from "@/components/admin/AdminCareLog";
import { 
  Loader2, 
  Users, 
  FileText, 
  Calendar, 
  Home,
  Shield,
  LogOut,
  ClipboardList
} from "lucide-react";

const AdminDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate("/dashboard");
    }
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
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Home className="h-4 w-4" />
              <span className="text-sm">Home</span>
            </Link>
            <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <span className="text-sm">Member Portal</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="font-serif text-xl font-semibold text-foreground">Admin Dashboard</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Welcome */}
          <div className="mb-8">
            <h2 className="font-serif text-3xl font-semibold text-foreground">
              Swan Hill Stables Admin
            </h2>
            <p className="text-muted-foreground mt-1">
              Manage clients, paperwork, and lesson availability
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="clients" className="space-y-6">
            <TabsList className="grid w-full max-w-lg grid-cols-4">
              <TabsTrigger value="clients" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Clients
              </TabsTrigger>
              <TabsTrigger value="carelog" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Care Log
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Paperwork
              </TabsTrigger>
              <TabsTrigger value="lessons" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Lessons
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clients">
              <AdminClientsList />
            </TabsContent>

            <TabsContent value="carelog">
              <AdminCareLog />
            </TabsContent>

            <TabsContent value="documents">
              <AdminDocuments />
            </TabsContent>

            <TabsContent value="lessons">
              <AdminLessonSlots />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminDashboard;