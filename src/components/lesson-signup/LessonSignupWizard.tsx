import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SignaturePad } from "./SignaturePad";
import {
  User, Trophy, CalendarDays, UserPlus, ScrollText, Shield,
  Check, ChevronRight, ChevronLeft, CheckCircle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Info", icon: User },
  { label: "Riding", icon: Trophy },
  { label: "Schedule", icon: CalendarDays },
  { label: "Account", icon: UserPlus },
  { label: "Barn Rules", icon: ScrollText },
  { label: "Waiver", icon: Shield },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const BARN_RULES_PDF_URL = "/documents/barn-rules-template.pdf";
const WAIVER_PDF_URL = "/documents/equine-release-template.pdf";

interface FormData {
  full_name: string; email: string; phone: string; age: string;
  experience_level: string; horse_preference: string; own_horse_name: string;
  goals: string; preferred_days: string[]; preferred_time: string;
  emergency_contact_name: string; emergency_contact_phone: string;
  special_needs: string; password: string; confirm_password: string;
}

export const LessonSignupWizard = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    full_name: "", email: "", phone: "", age: "",
    experience_level: "beginner", horse_preference: "school_horse",
    own_horse_name: "", goals: "", preferred_days: [], preferred_time: "flexible",
    emergency_contact_name: "", emergency_contact_phone: "",
    special_needs: "", password: "", confirm_password: "",
  });
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [barnRulesSignature, setBarnRulesSignature] = useState<string | null>(null);
  const [barnRulesAgreed, setBarnRulesAgreed] = useState(false);
  const [waiverSignature, setWaiverSignature] = useState<string | null>(null);
  const [waiverAgreed, setWaiverAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
      if (user.user_metadata?.full_name && !formData.full_name) updateField("full_name", user.user_metadata.full_name);
      if (user.email && !formData.email) updateField("email", user.email);
    }
  }, [user]);

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_days: prev.preferred_days.includes(day)
        ? prev.preferred_days.filter(d => d !== day)
        : [...prev.preferred_days, day],
    }));
    setErrors(prev => { const n = { ...prev }; delete n.preferred_days; return n; });
  };

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    switch (step) {
      case 0:
        if (!formData.full_name.trim()) e.full_name = "Name is required";
        if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) e.email = "Valid email required";
        break;
      case 2:
        if (formData.preferred_days.length === 0) e.preferred_days = "Select at least one day";
        if (!formData.emergency_contact_name.trim()) e.emergency_contact_name = "Required";
        if (!formData.emergency_contact_phone.trim()) e.emergency_contact_phone = "Required";
        break;
      case 3:
        if (!isAuthenticated && authMode === "signup") {
          if (!formData.password || formData.password.length < 6) e.password = "Min 6 characters";
          if (formData.password !== formData.confirm_password) e.confirm_password = "Passwords don't match";
        }
        if (!isAuthenticated && authMode === "signin") {
          if (!formData.password) e.password = "Password required";
        }
        break;
      case 4:
        if (!barnRulesAgreed) e.barn_rules_agreed = "You must agree to the barn rules";
        if (!barnRulesSignature) e.barn_rules_sig = "Signature is required";
        break;
      case 5:
        if (!waiverAgreed) e.waiver_agreed = "You must agree to the waiver";
        if (!waiverSignature) e.waiver_sig = "Signature is required";
        break;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (step === 3 && !isAuthenticated) {
      if (authMode === "signin") {
        setSigningIn(true);
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email: formData.email, password: formData.password,
          });
          if (error) { setErrors({ password: error.message }); return; }
          setIsAuthenticated(true);
        } finally { setSigningIn(false); }
      }
    }

    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => Math.max(0, s - 1));

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsSubmitting(true);
    try {
      const payload: any = {
        formData: {
          full_name: formData.full_name, email: formData.email,
          phone: formData.phone || null, age: formData.age ? parseInt(formData.age) : null,
          experience_level: formData.experience_level, horse_preference: formData.horse_preference,
          own_horse_name: formData.own_horse_name || null, goals: formData.goals || null,
          preferred_days: formData.preferred_days, preferred_time: formData.preferred_time,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          special_needs: formData.special_needs || null,
        },
        barnRulesSignature, waiverSignature,
      };
      if (!isAuthenticated) payload.password = formData.password;

      const { data, error } = await supabase.functions.invoke("lesson-signup-complete", { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (!isAuthenticated && formData.password) {
        await supabase.auth.signInWithPassword({ email: formData.email, password: formData.password });
      }
      setIsComplete(true);
    } catch (err: any) {
      toast({ title: "Something went wrong", description: err.message || "Please try again.", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  if (isComplete) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
        <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
        <h2 className="font-serif text-3xl font-semibold text-foreground mb-4">Application Complete!</h2>
        <p className="text-muted-foreground text-lg max-w-md mx-auto mb-2">Thank you for registering at Swan Hill Stables.</p>
        <p className="text-muted-foreground max-w-md mx-auto">
          A copy of your signed documents has been sent to <strong>{formData.email}</strong>. We'll be in touch soon!
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Progress */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  i < step ? "bg-primary text-primary-foreground" :
                  i === step ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                  "bg-muted text-muted-foreground"
                )}>
                  {i < step ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={cn("text-[10px] mt-1 hidden sm:block", i <= step ? "text-foreground font-medium" : "text-muted-foreground")}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={cn("h-0.5 w-4 sm:w-8 mx-1", i < step ? "bg-primary" : "bg-border")} />}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>

          {step === 0 && (
            <div className="space-y-6">
              <div><h2 className="font-serif text-2xl font-semibold text-foreground mb-1">Personal Information</h2><p className="text-sm text-muted-foreground">Tell us about the rider</p></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input value={formData.full_name} onChange={e => updateField("full_name", e.target.value)} placeholder="Jane Doe" />
                  {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={formData.email} onChange={e => updateField("email", e.target.value)} placeholder="jane@example.com" />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2"><Label>Phone</Label><Input value={formData.phone} onChange={e => updateField("phone", e.target.value)} placeholder="(555) 123-4567" /></div>
                <div className="space-y-2"><Label>Rider's Age</Label><Input type="number" value={formData.age} onChange={e => updateField("age", e.target.value)} placeholder="12" /></div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div><h2 className="font-serif text-2xl font-semibold text-foreground mb-1">Riding Experience</h2><p className="text-sm text-muted-foreground">Help us match you with the right program</p></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Experience Level *</Label>
                  <Select value={formData.experience_level} onValueChange={v => updateField("experience_level", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner — Never ridden</SelectItem>
                      <SelectItem value="novice">Novice — A few rides</SelectItem>
                      <SelectItem value="intermediate">Intermediate — Comfortable at all gaits</SelectItem>
                      <SelectItem value="advanced">Advanced — Competitive experience</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Horse *</Label>
                  <Select value={formData.horse_preference} onValueChange={v => updateField("horse_preference", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="school_horse">Use a school horse</SelectItem>
                      <SelectItem value="own_horse">Bring my own horse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.horse_preference === "own_horse" && (
                <div className="space-y-2"><Label>Horse's Name</Label><Input value={formData.own_horse_name} onChange={e => updateField("own_horse_name", e.target.value)} placeholder="Your horse's name" /></div>
              )}
              <div className="space-y-2"><Label>Riding Goals</Label><Textarea value={formData.goals} onChange={e => updateField("goals", e.target.value)} placeholder="Trail riding, jumping, dressage, general horsemanship..." rows={3} /></div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div><h2 className="font-serif text-2xl font-semibold text-foreground mb-1">Scheduling &amp; Emergency</h2><p className="text-sm text-muted-foreground">When works best and who to contact in an emergency</p></div>
              <div className="space-y-2">
                <Label>Preferred Days *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                  {DAYS.map(day => (
                    <button key={day} type="button" onClick={() => toggleDay(day)} className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors border",
                      formData.preferred_days.includes(day)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:bg-muted"
                    )}>{day}</button>
                  ))}
                </div>
                {errors.preferred_days && <p className="text-xs text-destructive">{errors.preferred_days}</p>}
              </div>
              <div className="space-y-2">
                <Label>Preferred Time *</Label>
                <Select value={formData.preferred_time} onValueChange={v => updateField("preferred_time", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (8am–12pm)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12pm–5pm)</SelectItem>
                    <SelectItem value="evening">Evening (5pm–8pm)</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="border-t border-border pt-4 mt-4">
                <h3 className="font-serif text-lg font-semibold mb-3">Emergency Contact</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Name *</Label>
                    <Input value={formData.emergency_contact_name} onChange={e => updateField("emergency_contact_name", e.target.value)} placeholder="John Doe" />
                    {errors.emergency_contact_name && <p className="text-xs text-destructive">{errors.emergency_contact_name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone *</Label>
                    <Input value={formData.emergency_contact_phone} onChange={e => updateField("emergency_contact_phone", e.target.value)} placeholder="(555) 987-6543" />
                    {errors.emergency_contact_phone && <p className="text-xs text-destructive">{errors.emergency_contact_phone}</p>}
                  </div>
                </div>
              </div>
              <div className="space-y-2"><Label>Special Needs or Accommodations</Label><Textarea value={formData.special_needs} onChange={e => updateField("special_needs", e.target.value)} placeholder="Allergies, physical limitations, etc." rows={2} /></div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">{isAuthenticated ? "Account Connected" : "Create Your Account"}</h2>
                <p className="text-sm text-muted-foreground">{isAuthenticated ? "You're signed in. Click Next to continue to document signing." : "Create an account to manage your lessons and documents"}</p>
              </div>
              {isAuthenticated ? (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
                  <CheckCircle className="h-10 w-10 text-primary mx-auto mb-3" />
                  <p className="font-medium text-foreground">Signed in as {user?.email || formData.email}</p>
                  <p className="text-sm text-muted-foreground mt-1">Your documents will be linked to this account.</p>
                </div>
              ) : authMode === "signup" ? (
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Email</Label><Input value={formData.email} disabled className="bg-muted" /></div>
                  <div className="space-y-2">
                    <Label>Password *</Label>
                    <Input type="password" value={formData.password} onChange={e => updateField("password", e.target.value)} placeholder="Min 6 characters" />
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm Password *</Label>
                    <Input type="password" value={formData.confirm_password} onChange={e => updateField("confirm_password", e.target.value)} placeholder="Confirm password" />
                    {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password}</p>}
                  </div>
                  <p className="text-sm text-muted-foreground">Already have an account? <button type="button" className="text-primary hover:underline font-medium" onClick={() => setAuthMode("signin")}>Sign in</button></p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Email</Label><Input value={formData.email} disabled className="bg-muted" /></div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={formData.password} onChange={e => updateField("password", e.target.value)} placeholder="Your password" />
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                  <p className="text-sm text-muted-foreground">Don't have an account? <button type="button" className="text-primary hover:underline font-medium" onClick={() => setAuthMode("signup")}>Create one</button></p>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div><h2 className="font-serif text-2xl font-semibold text-foreground mb-1">Barn Rules &amp; Safety Policies</h2><p className="text-sm text-muted-foreground">Please read carefully and sign below</p></div>
              <div className="max-h-80 overflow-y-auto border border-border rounded-lg p-6 bg-card">
                <BarnRulesDocument />
              </div>
              <div className="flex items-start gap-3">
                <Checkbox id="barn-rules-agree" checked={barnRulesAgreed} onCheckedChange={v => { setBarnRulesAgreed(!!v); setErrors(prev => { const n = { ...prev }; delete n.barn_rules_agreed; return n; }); }} />
                <label htmlFor="barn-rules-agree" className="text-sm leading-relaxed cursor-pointer">I have read and agree to abide by the Swan Hill Stables Barn Rules &amp; Safety Policies</label>
              </div>
              {errors.barn_rules_agreed && <p className="text-xs text-destructive">{errors.barn_rules_agreed}</p>}
              <div><Label className="mb-2 block">Signature *</Label><SignaturePad onSignatureChange={setBarnRulesSignature} signerName={formData.full_name} />{errors.barn_rules_sig && <p className="text-xs text-destructive mt-1">{errors.barn_rules_sig}</p>}</div>
              <p className="text-xs text-muted-foreground">Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div><h2 className="font-serif text-2xl font-semibold text-foreground mb-1">Liability Waiver</h2><p className="text-sm text-muted-foreground">Please read the waiver carefully and sign below</p></div>
              <div className="max-h-80 overflow-y-auto border border-border rounded-lg p-6 bg-card">
                <WaiverDocument fullName={formData.full_name} />
              </div>
              <div className="flex items-start gap-3">
                <Checkbox id="waiver-agree" checked={waiverAgreed} onCheckedChange={v => { setWaiverAgreed(!!v); setErrors(prev => { const n = { ...prev }; delete n.waiver_agreed; return n; }); }} />
                <label htmlFor="waiver-agree" className="text-sm leading-relaxed cursor-pointer">I have read and voluntarily agree to the Equine Activity Release &amp; Hold Harmless Agreement</label>
              </div>
              {errors.waiver_agreed && <p className="text-xs text-destructive">{errors.waiver_agreed}</p>}
              <div><Label className="mb-2 block">Signature *</Label><SignaturePad onSignatureChange={setWaiverSignature} signerName={formData.full_name} />{errors.waiver_sig && <p className="text-xs text-destructive mt-1">{errors.waiver_sig}</p>}</div>
              <p className="text-xs text-muted-foreground">Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={handleBack} disabled={step === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        {step === 5 ? (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : <>Submit Application <CheckCircle className="h-4 w-4 ml-1" /></>}
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={signingIn}>
            {signingIn ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in...</> : <>Next <ChevronRight className="h-4 w-4 ml-1" /></>}
          </Button>
        )}
      </div>
    </div>
  );
};
