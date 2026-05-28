import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Renders an HTML email inside a sandboxed iframe so external markup
 * can't break the surrounding app. Injects responsive styles, forces
 * links to open in a new tab, and auto-sizes height to content.
 */
export const EmailHtmlViewer = ({ html }: { html: string }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(400);

  const srcDoc = useMemo(() => {
    // Strip any <script> tags as a defense-in-depth measure (sandbox already blocks them).
    const safe = (html || "").replace(/<script[\s\S]*?<\/script>/gi, "");
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<base target="_blank" />
<style>
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #1a1a1a;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 15px;
    line-height: 1.55;
    word-wrap: break-word;
    overflow-wrap: anywhere;
    -webkit-text-size-adjust: 100%;
  }
  body { padding: 4px 2px 24px; }
  /* Constrain everything to viewport width — many emails use fixed widths */
  img, video, iframe, table, td, th, div, p, pre, code, blockquote {
    max-width: 100% !important;
    box-sizing: border-box;
  }
  img { height: auto !important; border: 0; display: inline-block; }
  table { border-collapse: collapse; width: auto !important; }
  pre, code { white-space: pre-wrap; word-break: break-word; }
  blockquote {
    border-left: 3px solid #d0d7de;
    margin: 12px 0;
    padding: 4px 0 4px 12px;
    color: #57606a;
  }
  a { color: #0969da; text-decoration: underline; }
  /* Prevent horizontal scrolling */
  body * { max-width: 100%; }
  /* Reasonable defaults for stripped-down clients */
  hr { border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0; }
</style>
</head>
<body>
${safe}
<script>
  // Force all links to open externally (in case base target is stripped)
  document.querySelectorAll('a[href]').forEach(function(a){
    a.setAttribute('target','_blank');
    a.setAttribute('rel','noopener noreferrer');
  });
  // Report height to parent
  function report() {
    var h = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
    parent.postMessage({ __emailIframeHeight: h }, '*');
  }
  window.addEventListener('load', report);
  // Re-measure when images finish loading
  document.querySelectorAll('img').forEach(function(img){
    if (!img.complete) img.addEventListener('load', report);
    img.addEventListener('error', report);
  });
  // Watch for late layout shifts
  if ('ResizeObserver' in window) {
    new ResizeObserver(report).observe(document.body);
  } else {
    setTimeout(report, 300);
    setTimeout(report, 1200);
  }
<\/script>
</body>
</html>`;
  }, [html]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const data = e.data as { __emailIframeHeight?: number };
      if (data && typeof data.__emailIframeHeight === "number") {
        setHeight(Math.min(Math.max(data.__emailIframeHeight + 20, 200), 20000));
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      title="Email content"
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      srcDoc={srcDoc}
      style={{ width: "100%", height, border: 0, display: "block", background: "#fff" }}
    />
  );
};
