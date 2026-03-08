import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eraser, PenTool, Type } from "lucide-react";

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string | null) => void;
  signerName: string;
}

export const SignaturePad = ({ onSignatureChange, signerName }: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (mode !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#3d3529";
  }, [mode]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (mode !== "draw") return;
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || mode !== "draw") return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setHasDrawn(true);
      const canvas = canvasRef.current;
      if (canvas) onSignatureChange(canvas.toDataURL("image/png"));
    }
  };

  // Type mode: generate signature on offscreen canvas
  useEffect(() => {
    if (mode !== "type") return;
    if (!typedName.trim()) { onSignatureChange(null); return; }
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 150;
    const ctx = canvas.getContext("2d")!;
    ctx.font = "italic 40px Georgia, serif";
    ctx.fillStyle = "#3d3529";
    ctx.textBaseline = "middle";
    ctx.fillText(typedName, 20, 75);
    onSignatureChange(canvas.toDataURL("image/png"));
  }, [typedName, mode]);

  const clear = () => {
    if (mode === "draw") {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setHasDrawn(false);
    } else {
      setTypedName("");
    }
    onSignatureChange(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button type="button" size="sm" variant={mode === "draw" ? "default" : "outline"} onClick={() => { setMode("draw"); onSignatureChange(null); setHasDrawn(false); }}>
          <PenTool className="h-3.5 w-3.5 mr-1" /> Draw
        </Button>
        <Button type="button" size="sm" variant={mode === "type" ? "default" : "outline"} onClick={() => { setMode("type"); onSignatureChange(null); setTypedName(signerName); }}>
          <Type className="h-3.5 w-3.5 mr-1" /> Type
        </Button>
        <div className="flex-1" />
        <Button type="button" size="sm" variant="ghost" onClick={clear}>
          <Eraser className="h-3.5 w-3.5 mr-1" /> Clear
        </Button>
      </div>
      <div className="border-2 border-dashed border-border rounded-lg bg-card relative">
        {mode === "draw" ? (
          <canvas
            ref={canvasRef}
            className="w-full h-28 cursor-crosshair touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        ) : (
          <Input
            value={typedName}
            onChange={e => setTypedName(e.target.value)}
            placeholder="Type your full name"
            className="text-2xl italic font-serif border-0 h-28 rounded-lg focus-visible:ring-0 bg-transparent text-center"
          />
        )}
        <div className="absolute bottom-1 right-2 text-[10px] text-muted-foreground pointer-events-none">
          {mode === "draw" ? (hasDrawn ? "✓ Signed" : "Draw your signature above") : (typedName ? "✓ Signed" : "Type your name")}
        </div>
      </div>
    </div>
  );
};
