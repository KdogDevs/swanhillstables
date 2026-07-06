import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: string;
  signerName: string | null;
  signatureData: string | null;
  signedAt: string | null;
  pdfUrl?: string | null;
}

const TEMPLATE_URLS: Record<string, string> = {
  barn_rules: "/documents/barn-rules-template.pdf",
  liability_waiver: "/documents/equine-release-template.pdf",
};

export const DocumentPreviewDialog = ({
  open,
  onOpenChange,
  documentType,
  pdfUrl,
}: DocumentPreviewDialogProps) => {
  const signedUrl = useSignedUrl(pdfUrl || null);

  const formatDocumentType = (type: string) =>
    type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  // Prefer the signed PDF (completed doc); fall back to the blank template
  const previewUrl = signedUrl || TEMPLATE_URLS[documentType] || null;
  const isSigned = !!signedUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 pr-6">
            <span>{formatDocumentType(documentType)} {isSigned && <span className="ml-2 text-xs font-normal text-primary">(Signed)</span>}</span>
            {previewUrl && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open
                  </a>
                </Button>
                <Button size="sm" asChild>
                  <a href={previewUrl} download>
                    <Download className="h-3.5 w-3.5 mr-1" /> Download
                  </a>
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[78vh] pr-1">
          {previewUrl ? (
            <object
              data={previewUrl}
              type="application/pdf"
              className="w-full h-[75vh] rounded-md border border-border bg-background"
            >
              <iframe
                src={previewUrl}
                title={`${formatDocumentType(documentType)} preview`}
                className="w-full h-[75vh] rounded-md border border-border bg-background"
              />
              <div className="text-center py-8 text-muted-foreground">
                <p>Your browser can't display this PDF inline.</p>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  Open in a new tab
                </a>
              </div>
            </object>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Preview not available for this document type.</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
