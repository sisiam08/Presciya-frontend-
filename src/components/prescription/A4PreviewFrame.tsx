"use client";

import React, { useEffect, useRef, useState } from "react";




const MM = 96 / 25.4;
const A4_PAGE_WIDTH = Math.round(210 * MM); 
const A4_MARGIN_X = Math.round(15 * MM); 
const A4_MARGIN_TOP = Math.round(15 * MM); 
const A4_MARGIN_BOTTOM = Math.round(20 * MM); 
const A4_CONTENT_WIDTH = A4_PAGE_WIDTH - A4_MARGIN_X * 2; 
const A4_CONTENT_MIN_HEIGHT = Math.round(262 * MM); 

interface A4PreviewFrameProps {
  
  html?: string | null;
  title?: string;
  className?: string;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
  onReady?: () => void;
}


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
  const [contentHeight, setContentHeight] = useState(A4_CONTENT_MIN_HEIGHT);

  
  
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const available = el.clientWidth;
      if (available > 0) {
        setScale(Math.min(1, available / A4_PAGE_WIDTH));
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  
  
  const measureContent = () => {
    const frame = internalRef.current;
    try {
      const doc = frame?.contentDocument;
      if (!doc) return;
      const height = Math.max(
        doc.body?.scrollHeight || 0,
        doc.documentElement?.scrollHeight || 0,
        A4_CONTENT_MIN_HEIGHT,
      );
      setContentHeight(height);
    } catch {
      
    }
  };

  const setRefs = (node: HTMLIFrameElement | null) => {
    internalRef.current = node;
    if (iframeRef) iframeRef.current = node;
  };

  const pageHeight = A4_MARGIN_TOP + contentHeight + A4_MARGIN_BOTTOM;
  const scaledWidth = A4_PAGE_WIDTH * scale;
  const scaledHeight = pageHeight * scale;

  return (
    <div ref={containerRef} className={`w-full overflow-x-hidden ${className}`}>
      <div
        className="mx-auto"
        style={{ width: scaledWidth, height: scaledHeight }}
      >
        <div
          className="bg-white shadow-sm ring-1 ring-black/5"
          style={{
            boxSizing: "border-box",
            width: A4_PAGE_WIDTH,
            height: pageHeight,
            padding: `${A4_MARGIN_TOP}px ${A4_MARGIN_X}px ${A4_MARGIN_BOTTOM}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
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
                display: "block",
                width: A4_CONTENT_WIDTH,
                height: contentHeight,
              }}
              className="border-0 bg-white"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
