import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Shield, Mail, Key, Users, Pencil, Loader2, UserCheck, UserX } from "lucide-react";

interface Profile { id: string; user_id: string; full_name: string | null; }
interface UserRole { id: string; user_id: string; role: string; }
interface EmailAccount {
  id: string; email_address: string; display_name: string;
  imap_host: string; smtp_host: string; is_shared: boolean;
  username: string; imap_port: number; smtp_port: number;
}
interface EmailAccess {
  id: string; email_account_id: string; user_id: string;
  can_read: boolean; can_send: boolean; can_delete: boolean;
}

export const AdminSuperSettings = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<EmailAccount | null>(null);
  const [accountAccess, setAccountAccess] = useState<EmailAccess[]>([]);
  const [loading, setLoading] = useState(true);

  // Add email account form
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [accEmail, setAccEmail] = useState("");
  const [accDisplayName, setAccDisplayName] = useState("");
  const [accUsername, setAccUsername] = useState("");
  const [accPassword, setAccPassword] = useState("");
  const [accImapHost, setAccImapHost] = useState("mx440c.netcup.net");
  const [accSmtpHost, setAccSmtpHost] = useState("mx440c.netcup.net");
  const [accIsShared, setAccIsShared] = useState(false);

  // Grant access
  const [showGrantAccess, setShowGrantAccess] = useState(false);
  const [grantUserId, setGrantUserId] = useState("");
  const [grantRead, setGrantRead] = useState(true);
  const [grantSend, setGrantSend] = useState(true);
  const [grantDelete, setGrantDelete] = useState(false);

  // Signature management
  const [showSignature, setShowSignature] = useState(false);
  const [sigUserId, setSigUserId] = useState("");
  const [sigHtml, setSigHtml] = useState("");

  const loadData = async () => {
    setLoading(true);
    const [profilesRes, rolesRes, accountsRes] = await Promise.all([
      supabase.from("profiles").select("id, user_id, full_name").order("full_name"),
      supabase.from("user_roles").select("*"),
      supabase.from("email_accounts").select("*").order("email_address"),
    ]);
    setProfiles(profilesRes.data || []);
    setRoles(rolesRes.data || []);
    setEmailAccounts(accountsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const loadAccountAccess = async (accountId: string) => {
    const { data } = await supabase.from("email_account_access").select("*").eq("email_account_id", accountId);
    setAccountAccess(data || []);
  };

  const getUserRoles = (userId: string) => roles.filter(r => r.user_id === userId).map(r => r.role);

  const addRole = async (userId: string, role: string) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
    if (error && error.code !== "23505") toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `${role} role assigned` }); loadData(); }
  };

  const removeRole = async (roleId: string) => {
    await supabase.from("user_roles").delete().eq("id", roleId);
    toast({ title: "Role removed" });
    loadData();
  };

  const addEmailAccount = async () => {
    if (!accEmail.trim() || !accUsername.trim() || !accPassword.trim()) {
      toast({ title: "Email, username, and password are required", variant: "destructive" }); return;
    }
    const { error } = await supabase.from("email_accounts").insert({
      email_address: accEmail.trim(), display_name: accDisplayName.trim() || accEmail.trim(),
      username: accUsername.trim(), password: accPassword,
      imap_host: accImapHost, smtp_host: accSmtpHost,
      imap_port: 993, smtp_port: 465, is_shared: accIsShared,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Email account added" }); setShowAddAccount(false);
      setAccEmail(""); setAccDisplayName(""); setAccUsername(""); setAccPassword("");
      loadData();
    }
  };

  const deleteEmailAccount = async (id: string) => {
    await supabase.from("email_accounts").delete().eq("id", id);
    toast({ title: "Account removed" });
    if (selectedAccount?.id === id) { setSelectedAccount(null); setAccountAccess([]); }
    loadData();
  };

  const grantAccess = async () => {
    if (!selectedAccount || !grantUserId) return;
    const { error } = await supabase.from("email_account_access").insert({
      email_account_id: selectedAccount.id, user_id: grantUserId,
      can_read: grantRead, can_send: grantSend, can_delete: grantDelete,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Access granted" }); setShowGrantAccess(false); loadAccountAccess(selectedAccount.id); }
  };

  const revokeAccess = async (accessId: string) => {
    await supabase.from("email_account_access").delete().eq("id", accessId);
    toast({ title: "Access revoked" });
    if (selectedAccount) loadAccountAccess(selectedAccount.id);
  };

  const saveSignature = async () => {
    if (!sigUserId) return;
    // Upsert default signature
    const { data: existing } = await supabase.from("email_signatures")
      .select("id").eq("user_id", sigUserId).eq("is_default", true).maybeSingle();

    if (existing) {
      await supabase.from("email_signatures").update({ signature_html: sigHtml }).eq("id", existing.id);
    } else {
      await supabase.from("email_signatures").insert({
        user_id: sigUserId, name: "Default", signature_html: sigHtml, is_default: true,
      });
    }
    toast({ title: "Signature saved" });
    setShowSignature(false);
  };

  const getProfileName = (userId: string) => {
    const p = profiles.find(p => p.user_id === userId);
    return p?.full_name || userId.slice(0, 8);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <Tabs defaultValue="roles" className="space-y-6">
      <TabsList className="flex flex-wrap h-auto gap-1">
        <TabsTrigger value="roles" className="gap-2"><Shield className="h-4 w-4" /> Roles</TabsTrigger>
        <TabsTrigger value="accounts" className="gap-2"><Mail className="h-4 w-4" /> Email Accounts</TabsTrigger>
        <TabsTrigger value="signatures" className="gap-2"><Key className="h-4 w-4" /> Signatures</TabsTrigger>
      </TabsList>

      {/* Role Management */}
      <TabsContent value="roles">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Role Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto"><Table className="min-w-[450px]">
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map(p => {
                  const userRoles = getUserRoles(p.user_id);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.full_name || "Unknown"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {userRoles.map(r => {
                            const roleEntry = roles.find(re => re.user_id === p.user_id && re.role === r);
                            return (
                              <Badge key={r} variant={r === "super_admin" ? "default" : "secondary"} className="gap-1">
                                {r}
                                <button onClick={() => roleEntry && removeRole(roleEntry.id)} className="ml-1 hover:text-destructive">×</button>
                              </Badge>
                            );
                          })}
                          {userRoles.length === 0 && <span className="text-muted-foreground text-sm">No roles</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {!userRoles.includes("admin") && (
                            <Button variant="outline" size="sm" onClick={() => addRole(p.user_id, "admin")}>
                              <UserCheck className="h-3 w-3 mr-1" /> Admin
                            </Button>
                          )}
                          {!userRoles.includes("super_admin") && (
                            <Button variant="outline" size="sm" onClick={() => addRole(p.user_id, "super_admin")}>
                              <Shield className="h-3 w-3 mr-1" /> Super Admin
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Email Accounts */}
      <TabsContent value="accounts">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Email Accounts</h3>
            <Button size="sm" onClick={() => setShowAddAccount(true)}><Plus className="h-4 w-4 mr-1" /> Add Account</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              {emailAccounts.map(acc => (
                <Card key={acc.id} className={`cursor-pointer transition-colors ${selectedAccount?.id === acc.id ? "border-primary" : ""}`}
                  onClick={() => { setSelectedAccount(acc); loadAccountAccess(acc.id); }}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{acc.email_address}</p>
                        <p className="text-xs text-muted-foreground">{acc.display_name}</p>
                        {acc.is_shared && <Badge variant="secondary" className="text-xs mt-1">Shared</Badge>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={e => { e.stopPropagation(); deleteEmailAccount(acc.id); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {emailAccounts.length === 0 && <p className="text-sm text-muted-foreground p-4">No accounts configured</p>}
            </div>

            <div className="col-span-2">
              {selectedAccount ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="truncate">Access Control: {selectedAccount.email_address}</span>
                      <Button size="sm" onClick={() => setShowGrantAccess(true)}>
                        <Plus className="h-4 w-4 mr-1" /> Grant Access
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Read</TableHead>
                          <TableHead>Send</TableHead>
                          <TableHead>Delete</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accountAccess.map(a => (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">{getProfileName(a.user_id)}</TableCell>
                            <TableCell><Badge variant={a.can_read ? "default" : "secondary"}>{a.can_read ? "Yes" : "No"}</Badge></TableCell>
                            <TableCell><Badge variant={a.can_send ? "default" : "secondary"}>{a.can_send ? "Yes" : "No"}</Badge></TableCell>
                            <TableCell><Badge variant={a.can_delete ? "default" : "secondary"}>{a.can_delete ? "Yes" : "No"}</Badge></TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => revokeAccess(a.id)}>
                                <UserX className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {accountAccess.length === 0 && (
                          <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No access grants</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground">Select an account to manage access</div>
              )}
            </div>
          </div>
        </div>

        {/* Add account dialog */}
        <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
          <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Email Account</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input value={accEmail} onChange={e => setAccEmail(e.target.value)} placeholder="Email address *" />
              <Input value={accDisplayName} onChange={e => setAccDisplayName(e.target.value)} placeholder="Display name" />
              <Input value={accUsername} onChange={e => setAccUsername(e.target.value)} placeholder="Login username *" />
              <Input type="password" value={accPassword} onChange={e => setAccPassword(e.target.value)} placeholder="Password *" />
              <Input value={accImapHost} onChange={e => setAccImapHost(e.target.value)} placeholder="IMAP host" />
              <Input value={accSmtpHost} onChange={e => setAccSmtpHost(e.target.value)} placeholder="SMTP host" />
              <div className="flex items-center gap-2">
                <Switch checked={accIsShared} onCheckedChange={setAccIsShared} />
                <span className="text-sm">Shared account (visible to all admins)</span>
              </div>
              <Button onClick={addEmailAccount} className="w-full">Add Account</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Grant access dialog */}
        <Dialog open={showGrantAccess} onOpenChange={setShowGrantAccess}>
          <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Grant Email Access</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={grantUserId} onValueChange={setGrantUserId}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                  {profiles.map(p => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.user_id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="space-y-2">
                <div className="flex items-center justify-between"><span className="text-sm">Can read emails</span><Switch checked={grantRead} onCheckedChange={setGrantRead} /></div>
                <div className="flex items-center justify-between"><span className="text-sm">Can send emails</span><Switch checked={grantSend} onCheckedChange={setGrantSend} /></div>
                <div className="flex items-center justify-between"><span className="text-sm">Can delete emails</span><Switch checked={grantDelete} onCheckedChange={setGrantDelete} /></div>
              </div>
              <Button onClick={grantAccess} className="w-full">Grant Access</Button>
            </div>
          </DialogContent>
        </Dialog>
      </TabsContent>

      {/* Signatures */}
      <TabsContent value="signatures">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Email Signatures
              <Button size="sm" onClick={() => setShowSignature(true)}>
                <Plus className="h-4 w-4 mr-1" /> Set Signature
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage email signatures for users. Signatures are automatically appended to outgoing emails.
            </p>
          </CardContent>
        </Card>

        <Dialog open={showSignature} onOpenChange={setShowSignature}>
          <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Set User Signature</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={sigUserId} onValueChange={setSigUserId}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                  {profiles.map(p => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.user_id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea value={sigHtml} onChange={e => setSigHtml(e.target.value)} placeholder="Signature HTML..." rows={6} />
              <Button onClick={saveSignature} className="w-full">Save Signature</Button>
            </div>
          </DialogContent>
        </Dialog>
      </TabsContent>
    </Tabs>
  );
};
