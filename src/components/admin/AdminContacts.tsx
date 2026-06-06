import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Users, UserPlus, X } from "lucide-react";

interface Contact {
  id: string; email: string; name: string | null; phone: string | null;
  company: string | null; notes: string | null; created_at: string;
}
interface ContactGroup {
  id: string; name: string; description: string | null; created_at: string;
}

export const AdminContacts = () => {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showGroupAdd, setShowGroupAdd] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"contacts" | "groups">("contacts");
  const [selectedGroup, setSelectedGroup] = useState<ContactGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<Contact[]>([]);

  // Form state
  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");

  const loadContacts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("contacts").select("*").order("name", { ascending: true });
    if (error) toast({ title: "Error loading contacts", description: error.message, variant: "destructive" });
    else setContacts(data || []);
    setLoading(false);
  };

  const loadGroups = async () => {
    const { data } = await supabase.from("contact_groups").select("*").order("name");
    setGroups(data || []);
  };

  const loadGroupMembers = async (groupId: string) => {
    const { data: members } = await supabase.from("contact_group_members").select("contact_id").eq("group_id", groupId);
    if (members && members.length > 0) {
      const ids = members.map(m => m.contact_id);
      const { data } = await supabase.from("contacts").select("*").in("id", ids);
      setGroupMembers(data || []);
    } else {
      setGroupMembers([]);
    }
  };

  useEffect(() => { loadContacts(); loadGroups(); }, []);

  const resetForm = () => { setFormEmail(""); setFormName(""); setFormPhone(""); setFormCompany(""); setFormNotes(""); };

  const handleSaveContact = async () => {
    if (!formEmail.trim()) { toast({ title: "Email is required", variant: "destructive" }); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editContact) {
      const { error } = await supabase.from("contacts").update({
        email: formEmail.trim(), name: formName.trim() || null, phone: formPhone.trim() || null,
        company: formCompany.trim() || null, notes: formNotes.trim() || null,
      }).eq("id", editContact.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Contact updated" }); setEditContact(null); }
    } else {
      const { error } = await supabase.from("contacts").insert({
        email: formEmail.trim(), name: formName.trim() || null, phone: formPhone.trim() || null,
        company: formCompany.trim() || null, notes: formNotes.trim() || null, created_by: user.id,
      });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Contact added" }); setShowAdd(false); }
    }
    resetForm();
    loadContacts();
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Contact deleted" }); loadContacts(); }
  };

  const handleSaveGroup = async () => {
    if (!groupName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("contact_groups").insert({
      name: groupName.trim(), description: groupDesc.trim() || null, created_by: user.id,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Group created" }); setShowGroupAdd(false); setGroupName(""); setGroupDesc(""); loadGroups(); }
  };

  const deleteGroup = async (id: string) => {
    await supabase.from("contact_groups").delete().eq("id", id);
    toast({ title: "Group deleted" });
    loadGroups();
    if (selectedGroup?.id === id) setSelectedGroup(null);
  };

  const addToGroup = async (contactId: string) => {
    if (!selectedGroup) return;
    const { error } = await supabase.from("contact_group_members").insert({
      group_id: selectedGroup.id, contact_id: contactId,
    });
    if (error && error.code !== "23505") toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Added to group" }); loadGroupMembers(selectedGroup.id); }
  };

  const removeFromGroup = async (contactId: string) => {
    if (!selectedGroup) return;
    await supabase.from("contact_group_members").delete().eq("group_id", selectedGroup.id).eq("contact_id", contactId);
    toast({ title: "Removed from group" });
    loadGroupMembers(selectedGroup.id);
  };

  const startEdit = (contact: Contact) => {
    setEditContact(contact);
    setFormEmail(contact.email);
    setFormName(contact.name || "");
    setFormPhone(contact.phone || "");
    setFormCompany(contact.company || "");
    setFormNotes(contact.notes || "");
  };

  const filtered = contacts.filter(c =>
    !searchQuery || [c.email, c.name, c.company, c.phone].some(f => f?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-2">
          <Button variant={activeTab === "contacts" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("contacts")}>
            All Contacts
          </Button>
          <Button variant={activeTab === "groups" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("groups")}>
            <Users className="h-4 w-4 mr-1" /> Groups
          </Button>
        </div>
        <div className="flex-1" />
        {activeTab === "contacts" && (
          <>
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search contacts..." className="w-full sm:max-w-xs h-8" />
            <Button size="sm" onClick={() => { resetForm(); setShowAdd(true); setEditContact(null); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Contact
            </Button>
          </>
        )}
        {activeTab === "groups" && (
          <Button size="sm" onClick={() => setShowGroupAdd(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Group
          </Button>
        )}
      </div>

      {/* Add/Edit contact dialog */}
      <Dialog open={showAdd || !!editContact} onOpenChange={v => { if (!v) { setShowAdd(false); setEditContact(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editContact ? "Edit Contact" : "Add Contact"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="Email *" />
            <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Name" />
            <Input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="Phone" />
            <Input value={formCompany} onChange={e => setFormCompany(e.target.value)} placeholder="Company" />
            <Textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Notes" rows={3} />
            <Button onClick={handleSaveContact} className="w-full">{editContact ? "Update" : "Add"} Contact</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add group dialog */}
      <Dialog open={showGroupAdd} onOpenChange={setShowGroupAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Contact Group</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name *" />
            <Textarea value={groupDesc} onChange={e => setGroupDesc(e.target.value)} placeholder="Description" rows={2} />
            <Button onClick={handleSaveGroup} className="w-full">Create Group</Button>
          </div>
        </DialogContent>
      </Dialog>

      {activeTab === "contacts" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto"><Table className="min-w-[500px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name || "—"}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.phone || "—"}</TableCell>
                    <TableCell>{c.company || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteContact(c.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No contacts found</TableCell></TableRow>
                )}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      )}

      {activeTab === "groups" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            {groups.map(g => (
              <Card key={g.id} className={`cursor-pointer transition-colors ${selectedGroup?.id === g.id ? "border-primary" : ""}`}
                onClick={() => { setSelectedGroup(g); loadGroupMembers(g.id); }}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{g.name}</p>
                    {g.description && <p className="text-xs text-muted-foreground">{g.description}</p>}
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={e => { e.stopPropagation(); deleteGroup(g.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            {groups.length === 0 && <p className="text-sm text-muted-foreground p-4">No groups yet</p>}
          </div>
          <div className="col-span-2">
            {selectedGroup ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    {selectedGroup.name}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm"><UserPlus className="h-4 w-4 mr-1" /> Add Members</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Add to {selectedGroup.name}</DialogTitle></DialogHeader>
                        <div className="max-h-60 overflow-y-auto space-y-1">
                          {contacts.filter(c => !groupMembers.some(m => m.id === c.id)).map(c => (
                            <button key={c.id} onClick={() => addToGroup(c.id)}
                              className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm">
                              {c.name || c.email} <span className="text-muted-foreground">({c.email})</span>
                            </button>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupMembers.map(m => (
                        <TableRow key={m.id}>
                          <TableCell>{m.name || "—"}</TableCell>
                          <TableCell>{m.email}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromGroup(m.id)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {groupMembers.length === 0 && (
                        <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No members</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground">Select a group to view members</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
