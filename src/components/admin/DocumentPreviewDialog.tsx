import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const formatDocumentType = (type: string) =>
    type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const previewUrl = pdfUrl || TEMPLATE_URLS[documentType] || null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{formatDocumentType(documentType)}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[78vh] pr-1">
          {previewUrl ? (
            <iframe
              src={`${previewUrl}#toolbar=1&navpanes=0`}
              title={`${formatDocumentType(documentType)} preview`}
              className="w-full h-[75vh] rounded-md border border-border bg-background"
            />
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
