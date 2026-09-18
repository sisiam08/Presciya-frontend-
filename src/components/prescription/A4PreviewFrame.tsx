"use client";

import React, { useEffect, useRef, useState } from "react";

// A4 printable area at 96dpi: 210mm - 15mm - 15mm = 180mm wide, and
// 297mm - 15mm - 20mm = 262mm tall. The backend document is laid out for this
// content box (@page margins), so rendering the iframe at these dimensions
// reproduces the printed layout exactly.
const A4_PRINTABLE_WIDTH_PX = 680;
const A4_PRINTABLE_MIN_HEIGHT_PX = 990;

interface A4PreviewFrameProps {
  /** Full HTML document to render (rendered by the backend, same as print). */
  html?: string | null;
  title?: string;
  className?: string;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
  onReady?: () => void;
}

/**
 * Renders an A4 document scaled to fit its container without ever cropping or
 * distorting it. The document keeps its true A4 content width; only the visual
 * scale adapts, so left/right/top/bottom are always fully visible.
 */
export default function A4PreviewFrame({
  html,
  title = "Prescription preview",
  className = "",
  iframeRef,
  onReady,
}: A4PreviewFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const internalRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(A4_PRINTABLE_MIN_HEIGHT_PX);

  // Fit-to-width scaling. Never upscale past 100% (avoids blurry rendering).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const available = el.clientWidth;
      if (available > 0) {
        setScale(Math.min(1, available / A4_PRINTABLE_WIDTH_PX));
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Measure the document height so a multi-page prescription is shown in full
  // (scrollable) rather than clipped inside a single A4 viewport.
  const measureContent = () => {
    const frame = internalRef.current;
    try {
      const doc = frame?.contentDocument;
      if (!doc) return;
      const height = Math.max(
        doc.body?.scrollHeight || 0,
        doc.documentElement?.scrollHeight || 0,
        A4_PRINTABLE_MIN_HEIGHT_PX,
      );
      setContentHeight(height);
    } catch {
      // Cross-origin content cannot be measured; fall back to one A4 page.
    }
  };

  const setRefs = (node: HTMLIFrameElement | null) => {
    internalRef.current = node;
    if (iframeRef) iframeRef.current = node;
  };

  const scaledWidth = A4_PRINTABLE_WIDTH_PX * scale;
  const scaledHeight = contentHeight * scale;

  return (
    <div ref={containerRef} className={`w-full overflow-x-hidden ${className}`}>
      <div
        className="relative mx-auto bg-white shadow-sm"
        style={{ width: scaledWidth, height: scaledHeight }}
      >
        {html ? (
          <iframe
            ref={setRefs}
            title={title}
            srcDoc={html}
            sandbox="allow-same-origin allow-modals"
            onLoad={() => {
              measureContent();
              onReady?.();
            }}
            style={{
              width: A4_PRINTABLE_WIDTH_PX,
              height: contentHeight,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
            className="border-0 bg-white"
          />
        ) : null}
      </div>
    </div>
  );
}
