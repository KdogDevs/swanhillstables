import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getSignedUrl } from "@/hooks/useSignedUrl";

interface MyDocument {
  id: string;
  document_type: string;
  status: string;
  signed_at: string | null;
  pdf_url: string | null;
}

const formatDocType = (type: string) =>
  type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

export const MyDocuments = () => {
  const { user } = useAuth();
  const [docs, setDocs] = useState<MyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchDocs = async () => {
      const { data } = await supabase
        .from("client_documents")
        .select("id, document_type, status, signed_at, pdf_url")
        .eq("user_id", user.id)
        .order("signed_at", { ascending: false });

      setDocs(data || []);
      setLoading(false);
    };

    fetchDocs();
  }, [user]);

  const handleDownload = async (doc: MyDocument) => {
    if (!doc.pdf_url) return;
    setDownloading(doc.id);

    try {
      const url = await getSignedUrl(doc.pdf_url);
      if (url) {
        window.open(url, "_blank");
      }
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (docs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          My Documents
        </CardTitle>
        <CardDescription>Your signed paperwork and agreements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{formatDocType(doc.document_type)}</p>
                  {doc.signed_at && (
                    <p className="text-xs text-muted-foreground">
                      Signed {format(new Date(doc.signed_at), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={doc.status === "signed" ? "default" : "outline"}
                  className={doc.status === "signed" ? "bg-green-600" : ""}
                >
                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                </Badge>
                {doc.pdf_url && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={downloading === doc.id}
                    onClick={() => handleDownload(doc)}
                  >
                    {downloading === doc.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
