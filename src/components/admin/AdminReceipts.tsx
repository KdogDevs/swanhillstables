import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, Trash2, Upload, Receipt as ReceiptIcon, Image as ImageIcon, TrendingUp, DollarSign, ScanLine, FileText } from "lucide-react";
import { format, parseISO, subMonths } from "date-fns";
import { PDFDocument } from "pdf-lib";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CATEGORIES = ["feed", "hay", "pellets", "bedding", "supplements", "medical", "tack", "other"];
const UNITS = ["bags", "bales", "lbs", "kg", "gallons", "bottles", "boxes", "units"];
const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#c5a55a", "#1e3a5f", "#8b6f3a", "#5a7ca0", "#a0826d", "#3d5a73"];

interface Receipt {
  id: string;
  vendor: string;
  amount: number;
  purchase_date: string;
  category: string;
  supply_id: string | null;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  receipt_image_url: string | null;
  uploaded_by: string;
  created_at: string;
}

interface SupplyOpt {
  id: string;
  supply_name: string;
  unit: string;
}

export const AdminReceipts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [supplies, setSupplies] = useState<SupplyOpt[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  // form
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [category, setCategory] = useState("feed");
  const [supplyId, setSupplyId] = useState<string>("none");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("bags");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const resetForm = () => {
    setVendor("");
    setAmount("");
    setPurchaseDate(format(new Date(), "yyyy-MM-dd"));
    setCategory("feed");
    setSupplyId("none");
    setQuantity("");
    setUnit("bags");
    setNotes("");
    setFile(null);
  };

  const fileToBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const s = r.result as string;
        resolve(s.split(",")[1] || "");
      };
      r.onerror = reject;
      r.readAsDataURL(f);
    });

  const imageToPdfBytes = async (f: File): Promise<Uint8Array> => {
    const bytes = new Uint8Array(await f.arrayBuffer());
    const pdf = await PDFDocument.create();
    const isPng = f.type.includes("png");
    const img = isPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
    const maxW = 612; // letter width pt
    const scale = Math.min(1, maxW / img.width);
    const w = img.width * scale;
    const h = img.height * scale;
    const page = pdf.addPage([w, h]);
    page.drawImage(img, { x: 0, y: 0, width: w, height: h });
    return await pdf.save();
  };

  const handleScan = async (f: File) => {
    setFile(f);
    setScanning(true);
    try {
      const base64 = await fileToBase64(f);
      const { data, error } = await supabase.functions.invoke("parse-receipt", {
        body: { imageBase64: base64, mimeType: f.type },
      });
      if (error) throw error;
      const r = (data as any)?.result || {};
      if (r.vendor) setVendor(r.vendor);
      if (r.amount != null) setAmount(String(r.amount));
      if (r.purchase_date) setPurchaseDate(r.purchase_date);
      if (r.category && CATEGORIES.includes(r.category)) setCategory(r.category);
      if (r.quantity != null) setQuantity(String(r.quantity));
      if (r.unit && UNITS.includes(r.unit)) setUnit(r.unit);
      if (r.notes) setNotes(r.notes);
      toast({ title: "Receipt scanned", description: "Review the extracted fields before saving." });
    } catch (e: any) {
      toast({ title: "Scan failed", description: e.message, variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const fetchAll = async () => {
    setIsLoading(true);
    const [{ data: r }, { data: s }] = await Promise.all([
      (supabase as any).from("supply_receipts").select("*").order("purchase_date", { ascending: false }),
      supabase.from("supply_inventory").select("id, supply_name, unit").order("supply_name"),
    ]);
    const rec = (r as Receipt[]) || [];
    setReceipts(rec);
    setSupplies((s as SupplyOpt[]) || []);
    // sign thumbnails
    const urls: Record<string, string> = {};
    await Promise.all(
      rec
        .filter((x) => x.receipt_image_url)
        .map(async (x) => {
          const { data } = await supabase.storage
            .from("supply-receipts")
            .createSignedUrl(x.receipt_image_url!, 3600);
          if (data?.signedUrl) urls[x.id] = data.signedUrl;
        })
    );
    setSignedUrls(urls);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSave = async () => {
    if (!vendor.trim() || !amount) {
      toast({ title: "Vendor and amount are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let imagePath: string | null = null;
      if (file) {
        // Convert any uploaded image to a PDF for archival
        const isImage = file.type.startsWith("image/");
        let uploadBody: Blob | File = file;
        let ext = file.name.split(".").pop() || "bin";
        let contentType = file.type || "application/octet-stream";
        if (isImage) {
          const pdfBytes = await imageToPdfBytes(file);
          uploadBody = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
          ext = "pdf";
          contentType = "application/pdf";
        }
        const path = `${user!.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("supply-receipts")
          .upload(path, uploadBody, { cacheControl: "3600", upsert: false, contentType });
        if (upErr) throw upErr;
        imagePath = path;
      }
      const { error } = await (supabase as any).from("supply_receipts").insert({
        vendor: vendor.trim(),
        amount: Number(amount),
        purchase_date: purchaseDate,
        category,
        supply_id: supplyId === "none" ? null : supplyId,
        quantity: quantity ? Number(quantity) : null,
        unit: quantity ? unit : null,
        notes: notes.trim() || null,
        receipt_image_url: imagePath,
        uploaded_by: user!.id,
      });
      if (error) throw error;
      toast({ title: "Receipt saved" });
      setShowDialog(false);
      resetForm();
      fetchAll();
    } catch (e: any) {
      toast({ title: "Failed to save receipt", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r: Receipt) => {
    if (!confirm(`Delete receipt from ${r.vendor}?`)) return;
    if (r.receipt_image_url) {
      await supabase.storage.from("supply-receipts").remove([r.receipt_image_url]);
    }
    const { error } = await (supabase as any).from("supply_receipts").delete().eq("id", r.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Receipt deleted" });
    fetchAll();
  };

  // Analytics
  const last12 = useMemo(() => {
    const cutoff = subMonths(new Date(), 11);
    cutoff.setDate(1);
    const map = new Map<string, number>();
    for (let i = 0; i < 12; i++) {
      const d = subMonths(new Date(), 11 - i);
      map.set(format(d, "yyyy-MM"), 0);
    }
    receipts.forEach((r) => {
      const d = parseISO(r.purchase_date);
      if (d >= cutoff) {
        const k = format(d, "yyyy-MM");
        map.set(k, (map.get(k) || 0) + Number(r.amount));
      }
    });
    return Array.from(map.entries()).map(([k, v]) => ({
      month: format(parseISO(k + "-01"), "MMM yy"),
      spend: Math.round(v * 100) / 100,
    }));
  }, [receipts]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    receipts.forEach((r) => map.set(r.category, (map.get(r.category) || 0) + Number(r.amount)));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  }, [receipts]);

  const usageBySupply = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; spend: number }>();
    receipts.forEach((r) => {
      const name =
        supplies.find((s) => s.id === r.supply_id)?.supply_name || (r.supply_id ? "Unknown" : "Unlinked");
      const cur = map.get(name) || { name, qty: 0, spend: 0 };
      cur.qty += Number(r.quantity || 0);
      cur.spend += Number(r.amount);
      map.set(name, cur);
    });
    return Array.from(map.values())
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 8)
      .map((x) => ({ ...x, spend: Math.round(x.spend * 100) / 100, qty: Math.round(x.qty * 100) / 100 }));
  }, [receipts, supplies]);

  const totalSpend = receipts.reduce((s, r) => s + Number(r.amount), 0);
  const ytdSpend = receipts
    .filter((r) => parseISO(r.purchase_date).getFullYear() === new Date().getFullYear())
    .reduce((s, r) => s + Number(r.amount), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Total Spend</CardDescription>
            <CardTitle className="text-2xl">${totalSpend.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Year to Date</CardDescription>
            <CardTitle className="text-2xl">${ytdSpend.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2"><ReceiptIcon className="h-4 w-4" /> Receipts</CardDescription>
            <CardTitle className="text-2xl">{receipts.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Spend (Last 12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={last12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} formatter={(v: any) => `$${v}`} />
                  <Line type="monotone" dataKey="spend" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spend by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {byCategory.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={90} label={(e: any) => e.name}>
                      {byCategory.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => `$${v}`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top Supplies — Spend & Quantity Purchased</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {usageBySupply.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageBySupply}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} angle={-15} textAnchor="end" height={60} />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="spend" name="Spend ($)" fill="hsl(var(--primary))" />
                    <Bar yAxisId="right" dataKey="qty" name="Quantity" fill="#c5a55a" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receipts list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle>Receipts</CardTitle>
            <CardDescription>Upload photos of receipts and track spending over time</CardDescription>
          </div>
          <Dialog open={showDialog} onOpenChange={(o) => { setShowDialog(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Receipt</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Receipt</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Vendor *</Label>
                    <Input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Tractor Supply" />
                  </div>
                  <div>
                    <Label>Amount *</Label>
                    <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Link to Supply (optional)</Label>
                  <Select value={supplyId} onValueChange={setSupplyId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {supplies.map((s) => <SelectItem key={s.id} value={s.id}>{s.supply_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Quantity</Label>
                    <Input type="number" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Select value={unit} onValueChange={setUnit}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                </div>
                <div>
                  <Label>Receipt Photo</Label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleScan(f);
                          }}
                        />
                        <div className="flex items-center justify-center gap-2 border border-dashed border-border rounded-md py-2 text-sm hover:bg-muted">
                          {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
                          {scanning ? "Scanning…" : "Scan with Camera"}
                        </div>
                      </label>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleScan(f);
                          }}
                        />
                        <div className="flex items-center justify-center gap-2 border border-dashed border-border rounded-md py-2 text-sm hover:bg-muted">
                          <Upload className="h-4 w-4" /> Upload Image
                        </div>
                      </label>
                    </div>
                    {file && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" /> {file.name} — will be archived as PDF
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Tip: scanning auto-fills vendor, amount, date, and category. Review before saving.
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Receipt"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {receipts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ReceiptIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No receipts yet. Add your first purchase to start tracking.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((r) => {
                    const supplyName = supplies.find((s) => s.id === r.supply_id)?.supply_name;
                    const url = signedUrls[r.id];
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          {url ? (
                            <button onClick={() => setPreviewUrl(url)} className="block">
                              <img src={url} alt="receipt" className="h-12 w-12 object-cover rounded border border-border" />
                            </button>
                          ) : (
                            <div className="h-12 w-12 rounded border border-border bg-muted flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{format(parseISO(r.purchase_date), "MMM d, yyyy")}</TableCell>
                        <TableCell className="font-medium">{r.vendor}</TableCell>
                        <TableCell><Badge variant="secondary" className="capitalize">{r.category}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{supplyName || "—"}</TableCell>
                        <TableCell className="text-right text-sm">{r.quantity ? `${r.quantity} ${r.unit || ""}` : "—"}</TableCell>
                        <TableCell className="text-right font-semibold">${Number(r.amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(r)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image preview */}
      <Dialog open={!!previewUrl} onOpenChange={(o) => !o && setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Receipt</DialogTitle></DialogHeader>
          {previewUrl && <img src={previewUrl} alt="Receipt" className="w-full h-auto rounded" />}
        </DialogContent>
      </Dialog>
    </div>
  );
};