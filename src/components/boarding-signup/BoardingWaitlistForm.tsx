import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tier, TIER_SHORT } from "./pricing";
import { Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  initialTier?: Tier;
  onClose: () => void;
}

export const BoardingWaitlistForm = ({ initialTier, onClose }: Props) => {
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    num_horses: "1",
    horse_genders: "",
    notes: "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.phone || !form.horse_genders) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("boarding_waitlist").insert({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      num_horses: Math.max(1, parseInt(form.num_horses || "1", 10)),
      horse_genders: form.horse_genders,
      tier: initialTier ?? null,
      notes: form.notes.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="py-8 text-center space-y-4">
        <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
        <h3 className="font-serif text-2xl font-semibold">You're on the list</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Thanks, {form.full_name.split(" ")[0]}. We'll reach out as soon as a stall opens up
          that fits your needs.
        </p>
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Our stalls are currently full{initialTier ? ` for the ${TIER_SHORT[initialTier]} option` : ""}.
        Join the waiting list and we'll contact you when space becomes available.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="wl-name">Full name *</Label>
          <Input id="wl-name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wl-phone">Phone number *</Label>
          <Input id="wl-phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="wl-email">Email *</Label>
          <Input id="wl-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wl-count">Number of horses *</Label>
          <Input
            id="wl-count"
            type="number"
            min={1}
            max={20}
            value={form.num_horses}
            onChange={(e) => set("num_horses", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wl-genders">Horse gender(s) — mare or gelding *</Label>
          <Input
            id="wl-genders"
            placeholder="e.g. 1 mare, 1 gelding"
            value={form.horse_genders}
            onChange={(e) => set("horse_genders", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="wl-notes">Anything else? (optional)</Label>
          <Textarea id="wl-notes" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Join Waiting List
        </Button>
      </div>
    </form>
  );
};