import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, Package, AlertTriangle, Loader2, History, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";

interface SupplyItem {
  id: string;
  supply_name: string;
  category: string;
  quantity: number;
  unit: string;
  low_threshold: number | null;
  notes: string | null;
  last_restocked_at: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface SupplyLogEntry {
  id: string;
  supply_id: string;
  change_amount: number;
  change_type: string;
  notes: string | null;
  logged_by: string;
  created_at: string;
}

const CATEGORIES = ["feed", "hay", "pellets", "bedding", "supplements", "medical", "tack", "other"];
const UNITS = ["bags", "bales", "lbs", "kg", "gallons", "bottles", "boxes", "units"];

export const AdminSupplyTracker = () => {
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [logs, setLogs] = useState<SupplyLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [editingSupply, setEditingSupply] = useState<SupplyItem | null>(null);
  const [selectedSupplyId, setSelectedSupplyId] = useState<string | null>(null);
  const [logType, setLogType] = useState<"add" | "use">("use");

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("feed");
  const [quantity, setQuantity] = useState("0");
  const [unit, setUnit] = useState("bags");
  const [threshold, setThreshold] = useState("5");
  const [notes, setNotes] = useState("");

  // Log form
  const [logAmount, setLogAmount] = useState("");
  const [logNotes, setLogNotes] = useState("");

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => { fetchSupplies(); }, []);

  const fetchSupplies = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("supply_inventory")
      .select("*")
      .order("category")
      .order("supply_name");
    if (!error) setSupplies((data as SupplyItem[]) || []);
    setIsLoading(false);
  };

  const fetchLogs = async (supplyId: string) => {
    const { data } = await supabase
      .from("supply_log")
      .select("*")
      .eq("supply_id", supplyId)
      .order("created_at", { ascending: false })
      .limit(50);
    setLogs((data as SupplyLogEntry[]) || []);
  };

  const handleSaveSupply = async () => {
    if (!user || !name.trim()) return;
    const payload = {
      supply_name: name.trim(),
      category,
      quantity: parseFloat(quantity) || 0,
      unit,
      low_threshold: parseFloat(threshold) || 5,
      notes: notes || null,
      updated_by: user.id,
    };

    let error;
    if (editingSupply) {
      ({ error } = await supabase.from("supply_inventory").update(payload).eq("id", editingSupply.id));
    } else {
      ({ error } = await supabase.from("supply_inventory").insert(payload));
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingSupply ? "Updated" : "Added", description: `${name} saved` });
      resetForm();
      setShowAddDialog(false);
      setEditingSupply(null);
      fetchSupplies();
    }
  };

  const handleLogChange = async () => {
    if (!user || !selectedSupplyId || !logAmount) return;
    const amount = parseFloat(logAmount);
    if (isNaN(amount) || amount <= 0) return;

    const actualChange = logType === "use" ? -amount : amount;

    const { error: logError } = await supabase.from("supply_log").insert({
      supply_id: selectedSupplyId,
      change_amount: actualChange,
      change_type: logType === "use" ? "used" : "restocked",
      notes: logNotes || null,
      logged_by: user.id,
    });

    if (logError) {
      toast({ title: "Error", description: logError.message, variant: "destructive" });
      return;
    }

    const supply = supplies.find(s => s.id === selectedSupplyId);
    if (supply) {
      const newQty = Math.max(0, supply.quantity + actualChange);
      await supabase.from("supply_inventory").update({
        quantity: newQty,
        updated_by: user.id,
        ...(logType === "add" ? { last_restocked_at: new Date().toISOString() } : {}),
      }).eq("id", selectedSupplyId);
    }

    toast({ title: logType === "use" ? "Used" : "Restocked", description: `${amount} ${supply?.unit || "units"} logged` });
    setLogAmount("");
    setLogNotes("");
    setShowLogDialog(false);
    fetchSupplies();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("supply_inventory").delete().eq("id", id);
    if (!error) { toast({ title: "Deleted" }); fetchSupplies(); }
  };

  const resetForm = () => {
    setName(""); setCategory("feed"); setQuantity("0"); setUnit("bags"); setThreshold("5"); setNotes("");
  };

  const openEdit = (s: SupplyItem) => {
    setEditingSupply(s);
    setName(s.supply_name);
    setCategory(s.category);
    setQuantity(String(s.quantity));
    setUnit(s.unit);
    setThreshold(String(s.low_threshold || 5));
    setNotes(s.notes || "");
    setShowAddDialog(true);
  };

  const openLog = (id: string, type: "add" | "use") => {
    setSelectedSupplyId(id);
    setLogType(type);
    setLogAmount("");
    setLogNotes("");
    setShowLogDialog(true);
  };

  const openHistory = (id: string) => {
    setSelectedSupplyId(id);
    fetchLogs(id);
    setShowHistoryDialog(true);
  };

  const getStatusBadge = (s: SupplyItem) => {
    if (s.quantity <= 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (s.low_threshold && s.quantity <= s.low_threshold) return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Low</Badge>;
    return <Badge variant="secondary" className="text-green-600">In Stock</Badge>;
  };

  const getProgressColor = (s: SupplyItem) => {
    if (s.quantity <= 0) return 0;
    const max = Math.max((s.low_threshold || 5) * 4, s.quantity);
    return Math.min(100, (s.quantity / max) * 100);
  };

  const lowStockItems = supplies.filter(s => s.low_threshold && s.quantity <= s.low_threshold);

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = supplies.filter(s => s.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string, SupplyItem[]>);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold">Supply Tracker</h2>
          <p className="text-muted-foreground">Monitor feed, hay, pellets, and other inventory</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingSupply(null); setShowAddDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Supply
        </Button>
      </div>

      {/* Low stock alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5" /> Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map(s => (
                <Badge key={s.id} variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">
                  {s.supply_name}: {s.quantity} {s.unit} remaining
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory by category */}
      {Object.entries(grouped).map(([cat, items]) => (
        <Card key={cat}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg capitalize flex items-center gap-2">
              <Package className="h-5 w-5" /> {cat}
            </CardTitle>
            <CardDescription>{items.length} item(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supply</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Last Restocked</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.supply_name}
                      {s.notes && <p className="text-xs text-muted-foreground mt-0.5">{s.notes}</p>}
                    </TableCell>
                    <TableCell>{s.quantity} {s.unit}</TableCell>
                    <TableCell>{getStatusBadge(s)}</TableCell>
                    <TableCell className="w-32">
                      <Progress value={getProgressColor(s)} className="h-2" />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.last_restocked_at ? format(new Date(s.last_restocked_at), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => openLog(s.id, "add")} title="Restock">
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-orange-600" onClick={() => openLog(s.id, "use")} title="Use">
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openHistory(s.id)} title="History">
                          <History className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(s)} title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(s.id)} title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {supplies.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No supplies tracked yet</p>
            <p className="text-sm">Add your first supply item to start tracking inventory</p>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(o) => { setShowAddDialog(o); if (!o) setEditingSupply(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSupply ? "Edit Supply" : "Add Supply"}</DialogTitle>
            <DialogDescription>Track a supply item in your inventory</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Purina Strategy" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Current Quantity</Label>
                <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} min="0" />
              </div>
              <div className="space-y-2">
                <Label>Low Stock Threshold</Label>
                <Input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} min="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Brand, supplier, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); setEditingSupply(null); }}>Cancel</Button>
            <Button onClick={handleSaveSupply} disabled={!name.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Change Dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{logType === "add" ? "Restock Supply" : "Log Usage"}</DialogTitle>
            <DialogDescription>
              {logType === "add" ? "Record new stock received" : "Record supply consumed"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" value={logAmount} onChange={e => setLogAmount(e.target.value)} min="0.1" step="0.1" placeholder="How much?" />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input value={logNotes} onChange={e => setLogNotes(e.target.value)} placeholder="e.g. Tractor Supply order" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogDialog(false)}>Cancel</Button>
            <Button onClick={handleLogChange} disabled={!logAmount || parseFloat(logAmount) <= 0}>
              {logType === "add" ? "Add Stock" : "Log Used"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Usage History</DialogTitle>
            <DialogDescription>
              {supplies.find(s => s.id === selectedSupplyId)?.supply_name}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No history yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="text-sm">{format(new Date(l.created_at), "MMM d, h:mm a")}</TableCell>
                      <TableCell>
                        <Badge variant={l.change_type === "restocked" ? "default" : "outline"}>
                          {l.change_type}
                        </Badge>
                      </TableCell>
                      <TableCell className={l.change_amount > 0 ? "text-green-600" : "text-orange-600"}>
                        {l.change_amount > 0 ? "+" : ""}{l.change_amount}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
