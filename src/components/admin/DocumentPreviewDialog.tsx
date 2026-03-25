import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarnRulesDocument } from "@/components/lesson-signup/BarnRulesDocument";
import { WaiverDocument } from "@/components/lesson-signup/WaiverDocument";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: string;
  signerName: string | null;
  signatureData: string | null;
  signedAt: string | null;
}

export const DocumentPreviewDialog = ({
  open,
  onOpenChange,
  documentType,
  signerName,
  signatureData,
  signedAt,
}: DocumentPreviewDialogProps) => {
  const renderDocument = () => {
    switch (documentType) {
      case "liability_waiver":
        return (
          <WaiverDocument
            fullName={signerName || ""}
            signatureData={signatureData}
            signedDate={signedAt}
          />
        );
      case "barn_rules":
        return (
          <BarnRulesDocument
            signerName={signerName || undefined}
            signatureData={signatureData}
            signedDate={signedAt}
          />
        );
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <p>Preview not available for this document type.</p>
          </div>
        );
    }
  };

  const formatDocumentType = (type: string) =>
    type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>{formatDocumentType(documentType)}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="p-4 bg-card border border-border rounded-lg">
            {renderDocument()}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
