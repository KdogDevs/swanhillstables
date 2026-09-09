import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2 } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  full_name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().max(30).optional(),
  experience_level: z.string().trim().min(1, "Please choose an experience level"),
  goals: z.string().trim().max(1000).optional(),
});

export const LessonInquiryForm = () => {
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    experience_level: "",
    goals: "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({
        title: parsed.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("lesson_signups").insert({
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      experience_level: parsed.data.experience_level,
      goals: parsed.data.goals || null,
    });
    setSaving(false);
    if (error) {
      toast({
        title: "Something went wrong",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
          <h2 className="font-serif text-2xl font-semibold">Thanks, we got it</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            We'll be in touch soon at {form.email} to talk through lesson times.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="li-name">Full name *</Label>
              <Input
                id="li-name"
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="li-phone">Phone number</Label>
              <Input
                id="li-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                maxLength={30}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="li-email">Email *</Label>
              <Input
                id="li-email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
                maxLength={255}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="li-exp">Riding experience *</Label>
              <Select
                value={form.experience_level}
                onValueChange={(v) => set("experience_level", v)}
              >
                <SelectTrigger id="li-exp">
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner — never ridden</SelectItem>
                  <SelectItem value="some_experience">Some experience</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="li-goals">
                Anything you'd like us to know? (optional)
              </Label>
              <Textarea
                id="li-goals"
                rows={4}
                value={form.goals}
                onChange={(e) => set("goals", e.target.value)}
                maxLength={1000}
                placeholder="Goals, age of rider, preferred days or times…"
              />
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Send Inquiry
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
