import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SignaturePad } from "@/components/lesson-signup/SignaturePad";
import {
  Home, Wheat, User, Stethoscope, FileSignature,
  Check, ChevronRight, ChevronLeft, CheckCircle, Loader2, UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tier, FeedPlan, TIER_LABELS, TIER_SHORT, TIER_INCLUDES, TIER_AVAILABILITY,
  FEED_LABELS, PRICE_MATRIX, ADDONS, calculateMonthly,
} from "./pricing";

const STEPS = [
  { label: "Tier", icon: Home },
  { label: "Feed", icon: Wheat },
  { label: "You", icon: User },
  { label: "Horse", icon: Home },
  { label: "Vet", icon: Stethoscope },
  { label: "Account", icon: UserPlus },
  { label: "Sign", icon: FileSignature },
];

interface FormData {
  tier: Tier | "";
  feed_plan: FeedPlan;
  addon_hay: boolean;
  addon_bedding: boolean;
  addon_blanketing: boolean;
  addon_grooming: boolean;
  addon_training: boolean;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  horse_name: string;
  horse_breed: string;
  horse_age: string;
  horse_sex: "gelding" | "mare";
  horse_color: string;
  vet_name: string;
  vet_phone: string;
  emergency_authorize: boolean;
  emergency_limit: string;
  password: string;
  confirm_password: string;
}

interface Props {
  initialTier?: Tier;
  onClose?: () => void;
}

export const BoardingSignupWizard = ({ initialTier, onClose }: Props) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    tier: initialTier || "",
    feed_plan: "boarder",
    addon_hay: false,
    addon_bedding: false,
    addon_blanketing: false,
    addon_grooming: false,
    addon_training: false,
    full_name: "", email: "", phone: "", address: "",
    horse_name: "", horse_breed: "", horse_age: "",
    horse_sex: "gelding", horse_color: "",
    vet_name: "", vet_phone: "",
    emergency_authorize: false, emergency_limit: "500",
    password: "", confirm_password: "",
  });
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
      if (user.user_metadata?.full_name && !formData.full_name) {
        update("full_name", user.user_metadata.full_name);
      }
      if (user.email && !formData.email) update("email", user.email);
    }
  }, [user]);

  const update = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const monthly = formData.tier
    ? calculateMonthly(formData.tier, formData.feed_plan, {
        hay: formData.addon_hay,
        bedding: formData.addon_bedding,
      })
    : 0;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    switch (step) {
      case 0:
        if (!formData.tier) e.tier = "Select a boarding tier";
        break;
      case 2:
        if (!formData.full_name.trim()) e.full_name = "Required";
        if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) e.email = "Valid email required";
        if (!formData.phone.trim()) e.phone = "Required";
        if (!formData.address.trim()) e.address = "Required";
        break;
      case 3:
        if (!formData.horse_name.trim()) e.horse_name = "Required";
        if (!formData.horse_breed.trim()) e.horse_breed = "Required";
        if (!formData.horse_age.trim()) e.horse_age = "Required";
        if (!formData.horse_color.trim()) e.horse_color = "Required";
        break;
      case 5:
        if (!isAuthenticated && authMode === "signup") {
          if (!formData.password || formData.password.length < 6) e.password = "Min 6 characters";
          if (formData.password !== formData.confirm_password) e.confirm_password = "Passwords don't match";
        }
        if (!isAuthenticated && authMode === "signin") {
          if (!formData.password) e.password = "Password required";
        }
        break;
      case 6:
        if (!agreed) e.agreed = "You must agree to the boarding agreement terms";
        if (!signature) e.signature = "Signature is required";
        break;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;
    if (step === 5 && !isAuthenticated && authMode === "signin") {
      setSigningIn(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email, password: formData.password,
        });
        if (error) { setErrors({ password: error.message }); return; }
        setIsAuthenticated(true);
      } finally { setSigningIn(false); }
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const payload: any = {
        formData: {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          horse_name: formData.horse_name,
          horse_breed: formData.horse_breed,
          horse_age: formData.horse_age,
          horse_sex: formData.horse_sex,
          horse_color: formData.horse_color,
          tier: formData.tier,
          feed_plan: formData.feed_plan,
          monthly_amount: monthly,
          addon_hay: formData.addon_hay,
          addon_bedding: formData.addon_bedding,
          addon_blanketing: formData.addon_blanketing,
          addon_grooming: formData.addon_grooming,
          addon_training: formData.addon_training,
          vet_name: formData.vet_name || null,
          vet_phone: formData.vet_phone || null,
          emergency_authorize: formData.emergency_authorize,
          emergency_limit: formData.emergency_authorize ? formData.emergency_limit : null,
        },
        signatureData: signature,
      };
      if (!isAuthenticated) payload.password = formData.password;

      const { data, error } = await supabase.functions.invoke("boarding-signup-complete", { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (!isAuthenticated && formData.password) {
        await supabase.auth.signInWithPassword({ email: formData.email, password: formData.password });
      }
      setIsComplete(true);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally { setIsSubmitting(false); }
  };

  if (isComplete) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
        <h2 className="font-serif text-3xl font-semibold text-foreground mb-4">Agreement Submitted!</h2>
        <p className="text-muted-foreground text-lg max-w-md mx-auto mb-2">
          A signed copy of your boarding agreement has been emailed to <strong>{formData.email}</strong>.
        </p>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Nicole will review and reach out shortly to coordinate your move-in.
        </p>
        {onClose && <Button onClick={onClose}>Close</Button>}
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Progress */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all",
                  i < step ? "bg-primary text-primary-foreground" :
                  i === step ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                  "bg-muted text-muted-foreground",
                )}>
                  {i < step ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={cn("text-[10px] mt-1 hidden sm:block", i <= step ? "text-foreground font-medium" : "text-muted-foreground")}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && <div className={cn("h-0.5 w-2 sm:w-6 mx-0.5 sm:mx-1", i < step ? "bg-primary" : "bg-border")} />}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>

          {/* Step 0 — Tier */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">Choose Your Boarding Tier</h2>
                <p className="text-sm text-muted-foreground">Subject to availability</p>
              </div>
              <RadioGroup value={formData.tier} onValueChange={(v) => update("tier", v as Tier)} className="space-y-3">
                {(["indoor", "outdoor"] as Tier[]).map((t) => (
                  <Label
                    key={t}
                    htmlFor={`tier-${t}`}
                    className={cn(
                      "flex items-start gap-4 border-2 rounded-lg p-4 cursor-pointer transition-all hover:bg-muted/40",
                      formData.tier === t ? "border-primary bg-primary/5" : "border-border",
                    )}
                  >
                    <RadioGroupItem value={t} id={`tier-${t}`} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-1 sm:gap-3">
                        <span className="font-serif text-lg font-semibold text-foreground">{TIER_LABELS[t]}</span>
                        <span className="text-xs text-muted-foreground">{TIER_AVAILABILITY[t]}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Starting at <strong className="text-foreground">${PRICE_MATRIX[t].boarder}/mo</strong>
                      </p>
                      <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1 mt-2">
                        {TIER_INCLUDES[t].map((f) => (
                          <li key={f} className="text-xs text-muted-foreground flex items-start gap-1">
                            <Check className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
              {errors.tier && <p className="text-xs text-destructive">{errors.tier}</p>}
            </div>
          )}

          {/* Step 1 — Feed plan + add-ons */}
          {step === 1 && formData.tier && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">Feed Plan & Add-Ons</h2>
                <p className="text-sm text-muted-foreground">
                  Feed options: Tucker Milling non-GMO 14% Starch Maintenance Pellets or Triple Crown Gold Senior Performance Pellets
                </p>
              </div>

              <div className="space-y-2">
                <Label>Feed Plan *</Label>
                <RadioGroup value={formData.feed_plan} onValueChange={(v) => update("feed_plan", v as FeedPlan)} className="space-y-2">
                  {(Object.keys(FEED_LABELS) as FeedPlan[]).map((fp) => (
                    <Label key={fp} htmlFor={`fp-${fp}`} className={cn(
                      "flex items-center justify-between gap-3 border rounded-md p-3 cursor-pointer transition-all hover:bg-muted/40",
                      formData.feed_plan === fp ? "border-primary bg-primary/5" : "border-border",
                    )}>
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={fp} id={`fp-${fp}`} />
                        <span className="text-sm">{FEED_LABELS[fp]}</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">${PRICE_MATRIX[formData.tier as Tier][fp]}/mo</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <Label>Optional Add-Ons</Label>
                <Label className="flex items-center justify-between gap-3 border rounded-md p-3 cursor-pointer hover:bg-muted/40">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={formData.addon_hay} onCheckedChange={(v) => update("addon_hay", !!v)} />
                    <span className="text-sm">Hay (additional)</span>
                  </div>
                  <span className="text-sm text-muted-foreground">+$100/mo</span>
                </Label>
                <Label className="flex items-center justify-between gap-3 border rounded-md p-3 cursor-pointer hover:bg-muted/40">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={formData.addon_bedding} onCheckedChange={(v) => update("addon_bedding", !!v)} />
                    <span className="text-sm">Pelletized bedding</span>
                  </div>
                  <span className="text-sm text-muted-foreground">+$60/mo</span>
                </Label>
                <p className="text-xs text-muted-foreground pt-2">
                  Note other services (blanketing, grooming, training rides, vet/farrier holds, deworming) are billed separately and can be requested at any time.
                </p>
              </div>

              <div className="bg-primary text-primary-foreground rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide opacity-80">Estimated Monthly Total</p>
                  <p className="font-serif text-3xl font-semibold">${monthly}</p>
                </div>
                <p className="text-xs opacity-80 max-w-[180px] text-right">
                  {TIER_SHORT[formData.tier as Tier]}<br />
                  Pay to: <em>Hill Of Iron Equestrian Services LLC</em>
                </p>
              </div>
            </div>
          )}

          {/* Step 2 — Boarder info */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">Your Information</h2>
                <p className="text-sm text-muted-foreground">For the boarding agreement</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input value={formData.full_name} onChange={(e) => update("full_name", e.target.value)} />
                  {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={formData.email} onChange={(e) => update("email", e.target.value)} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input value={formData.phone} onChange={(e) => update("phone", e.target.value)} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Address *</Label>
                  <Input value={formData.address} onChange={(e) => update("address", e.target.value)} placeholder="Street, City, State, ZIP" />
                  {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Horse info */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">Horse Information</h2>
                <p className="text-sm text-muted-foreground">Tell us about your horse</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Horse Name *</Label>
                  <Input value={formData.horse_name} onChange={(e) => update("horse_name", e.target.value)} />
                  {errors.horse_name && <p className="text-xs text-destructive">{errors.horse_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Breed *</Label>
                  <Input value={formData.horse_breed} onChange={(e) => update("horse_breed", e.target.value)} />
                  {errors.horse_breed && <p className="text-xs text-destructive">{errors.horse_breed}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Age *</Label>
                  <Input value={formData.horse_age} onChange={(e) => update("horse_age", e.target.value)} placeholder="e.g. 8" />
                  {errors.horse_age && <p className="text-xs text-destructive">{errors.horse_age}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Sex *</Label>
                  <RadioGroup value={formData.horse_sex} onValueChange={(v) => update("horse_sex", v)} className="flex gap-4 pt-2">
                    <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="gelding" /> Gelding</Label>
                    <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="mare" /> Mare</Label>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label>Color / Markings *</Label>
                  <Input value={formData.horse_color} onChange={(e) => update("horse_color", e.target.value)} placeholder="e.g. Bay with star" />
                  {errors.horse_color && <p className="text-xs text-destructive">{errors.horse_color}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Vet & emergency */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">Veterinarian & Emergency Care</h2>
                <p className="text-sm text-muted-foreground">Optional but strongly recommended</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Veterinarian Name</Label>
                  <Input value={formData.vet_name} onChange={(e) => update("vet_name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Veterinarian Phone</Label>
                  <Input value={formData.vet_phone} onChange={(e) => update("vet_phone", e.target.value)} />
                </div>
              </div>
              <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
                <Label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={formData.emergency_authorize}
                    onCheckedChange={(v) => update("emergency_authorize", !!v)}
                    className="mt-0.5"
                  />
                  <span className="text-sm">
                    I authorize Swan Hill Stables to arrange emergency veterinary care for my horse if I cannot be reached, up to the amount below.
                  </span>
                </Label>
                {formData.emergency_authorize && (
                  <div className="ml-7 space-y-1">
                    <Label className="text-xs">Authorized limit ($)</Label>
                    <Input
                      type="number"
                      value={formData.emergency_limit}
                      onChange={(e) => update("emergency_limit", e.target.value)}
                      className="max-w-[160px]"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5 — Account */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">
                  {isAuthenticated ? "Account Connected" : "Create Your Account"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isAuthenticated
                    ? "Your boarding agreement will be linked to this account."
                    : "Create an account so you can access your signed agreement and updates."}
                </p>
              </div>
              {isAuthenticated ? (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
                  <CheckCircle className="h-10 w-10 text-primary mx-auto mb-3" />
                  <p className="font-medium text-foreground">Signed in as {user?.email || formData.email}</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant={authMode === "signup" ? "default" : "outline"} size="sm" onClick={() => setAuthMode("signup")}>
                      Create Account
                    </Button>
                    <Button type="button" variant={authMode === "signin" ? "default" : "outline"} size="sm" onClick={() => setAuthMode("signin")}>
                      I Have an Account
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={formData.email} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>Password *</Label>
                      <Input type="password" value={formData.password} onChange={(e) => update("password", e.target.value)} />
                      {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                    </div>
                    {authMode === "signup" && (
                      <div className="space-y-2">
                        <Label>Confirm Password *</Label>
                        <Input type="password" value={formData.confirm_password} onChange={(e) => update("confirm_password", e.target.value)} />
                        {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password}</p>}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 6 — Review & Sign */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">Review & Sign</h2>
                <p className="text-sm text-muted-foreground">
                  Your selections below will be filled into the official Horse Boarding Agreement and sent to you as a signed PDF.
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-5 space-y-2 text-sm">
                <Row label="Boarder" value={formData.full_name} />
                <Row label="Horse" value={`${formData.horse_name} — ${formData.horse_breed}, ${formData.horse_age}, ${formData.horse_sex}, ${formData.horse_color}`} />
                <Row label="Tier" value={TIER_LABELS[formData.tier as Tier]} />
                <Row label="Feed plan" value={FEED_LABELS[formData.feed_plan]} />
                {(formData.addon_hay || formData.addon_bedding) && (
                  <Row label="Add-ons" value={[
                    formData.addon_hay && "Hay",
                    formData.addon_bedding && "Bedding",
                  ].filter(Boolean).join(", ")} />
                )}
                <Row label="Vet" value={formData.vet_name ? `${formData.vet_name} ${formData.vet_phone}` : "—"} />
                <Row label="Emergency auth" value={formData.emergency_authorize ? `Yes, up to $${formData.emergency_limit}` : "No"} />
                <div className="pt-2 mt-2 border-t border-border flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Monthly Total</span>
                  <span className="font-serif text-2xl font-semibold text-primary">${monthly}</span>
                </div>
              </div>

              <Label className="flex items-start gap-3 cursor-pointer">
                <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="mt-0.5" />
                <span className="text-sm text-muted-foreground">
                  I have read and agree to the{" "}
                  <a href="/documents/boarding-agreement-template.pdf" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Horse Boarding Agreement
                  </a>{" "}
                  including the Alabama Equine Activities Liability Protection Act notice, late fees, termination, and abandonment terms.
                </span>
              </Label>
              {errors.agreed && <p className="text-xs text-destructive">{errors.agreed}</p>}

              <div className="space-y-2">
                <Label>Boarder Signature *</Label>
                <SignaturePad signerName={formData.full_name} onSignatureChange={setSignature} />
                {errors.signature && <p className="text-xs text-destructive">{errors.signature}</p>}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Nav */}
      <div className="flex items-center justify-between pt-4 border-t border-border gap-2">
        <Button variant="ghost" onClick={handleBack} disabled={step === 0 || isSubmitting}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={handleNext} disabled={signingIn}>
            {signingIn ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Signing in</> : <>Next <ChevronRight className="h-4 w-4 ml-1" /></>}
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Submitting</> : <>Submit Agreement <Check className="h-4 w-4 ml-1" /></>}
          </Button>
        )}
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-3">
    <span className="text-xs uppercase tracking-wide text-muted-foreground w-24 sm:w-32 flex-shrink-0 pt-0.5">{label}</span>
    <span className="text-foreground text-right break-words min-w-0">{value || "—"}</span>
  </div>
);
