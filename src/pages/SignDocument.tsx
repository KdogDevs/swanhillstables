import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle, AlertTriangle, Shield } from "lucide-react";
import { SignaturePad } from "@/components/lesson-signup/SignaturePad";
import { toast } from "@/hooks/use-toast";

const LABELS: Record<string, string> = {
  boarding_agreement: "Boarding Agreement",
  liability_waiver: "Liability Waiver",
  barn_rules: "Barn Rules & Safety Policies",
};

const TEMPLATE_URLS: Record<string, string> = {
  boarding_agreement: "/documents/boarding-agreement-template.pdf",
  liability_waiver: "/documents/equine-release-template.pdf",
  barn_rules: "/documents/barn-rules-template.pdf",
};

const SignDocument = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docType, setDocType] = useState<string>("");
  const [signerName, setSignerName] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const url = `https://rvmpjcargszbnkjynxxu.supabase.co/functions/v1/get-signing-doc?token=${encodeURIComponent(token || "")}`;
        const res = await fetch(url, {
          headers: {
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bXBqY2FyZ3N6Ym5ranlueHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NTU3MDgsImV4cCI6MjA4NDIzMTcwOH0.WDpyuKD_h3qtsLspeN7HOPGsALSZXK0JgI3ZuZeZ_Hs",
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Invalid link");
        setDocType(data.document_type);
        setSignerName(data.recipient_name || "");
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const submit = async () => {
    if (!signerName.trim() || !signature || !agreed) {
      toast({ title: "Missing info", description: "Name, signature, and agreement are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error: err } = await supabase.functions.invoke("sign-document-with-token", {
        body: { token, signature_data: signature, signer_name: signerName.trim() },
      });
      if (err) throw err;
      if (data?.error) throw new Error(data.error);
      setDone(true);
    } catch (e: any) {
      toast({ title: "Could not sign", description: e.message || "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-semibold mb-2">Link Unavailable</h1>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground mt-4">Please contact Swan Hill Stables for a new link.</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="font-serif text-3xl font-semibold mb-2">Signed!</h1>
          <p className="text-muted-foreground">Thanks {signerName}. A signed PDF has been emailed to you.</p>
        </div>
      </div>
    );
  }

  const templateUrl = TEMPLATE_URLS[docType];

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <Shield className="h-10 w-10 text-primary mx-auto mb-2" />
          <h1 className="font-serif text-3xl font-semibold">{LABELS[docType] || "Document"}</h1>
          <p className="text-sm text-muted-foreground mt-1">Swan Hill Stables — Please review and sign below</p>
        </div>

        {templateUrl && (
          <div className="border border-border rounded-lg overflow-hidden bg-card">
            <iframe src={templateUrl} title="Document" className="w-full h-[600px]" />
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="space-y-2">
            <Label>Your Full Name *</Label>
            <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Full legal name" />
          </div>

          <div className="space-y-2">
            <Label>Signature *</Label>
            <SignaturePad onSignatureChange={setSignature} signerName={signerName} />
          </div>

          <div className="flex items-start gap-2 pt-2">
            <Checkbox id="agree" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
            <label htmlFor="agree" className="text-sm text-foreground cursor-pointer">
              I have read and agree to the terms of this {LABELS[docType]?.toLowerCase()}.
            </label>
          </div>

          <Button onClick={submit} disabled={submitting} className="w-full" size="lg">
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing…</> : "Submit Signed Document"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignDocument;