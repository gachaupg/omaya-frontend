// DragFitCaptcha.tsx
import React, { useRef, useEffect, useState, useCallback } from "react";

// Add CSS animation styles
const styles = `
  @keyframes pulse {
    0%, 100% { 
      box-shadow: 0 3px 8px rgba(0,0,0,0.2), 0 0 0 0 rgba(76, 175, 80, 0.4);
    }
    50% { 
      box-shadow: 0 3px 8px rgba(0,0,0,0.2), 0 0 0 8px rgba(76, 175, 80, 0);
    }
  }
  
  @keyframes pulseDark {
    0%, 100% { 
      box-shadow: 0 3px 8px rgba(0,0,0,0.5), 0 0 0 0 rgba(76, 175, 80, 0.4);
    }
    50% { 
      box-shadow: 0 3px 8px rgba(0,0,0,0.5), 0 0 0 8px rgba(76, 175, 80, 0);
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

interface DragFitCaptchaProps {
  imgSrc: string;
  width?: number;
  height?: number;
  onSuccess?: (result: { x: number; y: number }) => void;
  tolerance?: number;
  darkMode?: boolean;
}

export default function DragFitCaptcha({
  imgSrc,
  width = 360,
  height = 180,
  onSuccess = () => {},
  tolerance = 8,
  darkMode = false,
}: DragFitCaptchaProps) {
  const bgRef = useRef<HTMLCanvasElement>(null);
  const pieceRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [loaded, setLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [canvasWidth, setCanvasWidth] = useState(width);
  const [canvasHeight, setCanvasHeight] = useState(height);
  const imgRef = useRef<HTMLImageElement>(new Image());
  const [target, setTarget] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [piecePosition, setPiecePosition] = useState<number>(0);
  const [dragging, setDragging] = useState<boolean>(false);
  const startXRef = useRef<number>(0);
  const pieceStartXRef = useRef<number>(0);
  const pieceSize = Math.round(Math.min(canvasWidth, canvasHeight) / 4);

  useEffect(() => {
    setCanvasWidth(width);
    setCanvasHeight(height);
  }, [width, height]);

  // Fit puzzle to modal width on small screens
  useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    const updateSize = () => {
      const available = Math.max(280, Math.min(width, parent.clientWidth));
      setCanvasWidth(available);
      setCanvasHeight(Math.round(available * (height / width)));
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [width, height]);

  // draw puzzle shape path helper
  const puzzlePath = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const r = size / 6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + size / 3, y);
    // top knob
    ctx.arc(x + size / 2, y, r, Math.PI, 0, true);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x + size, y + size / 3);
    // right knob
    ctx.arc(x + size, y + size / 2, r, -Math.PI/2, Math.PI/2, true);
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x + 2*size/3, y + size);
    // bottom knob
    ctx.arc(x + size/2, y + size, r, 0, Math.PI, true);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x, y + 2*size/3);
    // left knob
    ctx.arc(x, y + size/2, r, Math.PI/2, -Math.PI/2, true);
    ctx.closePath();
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    setLoaded(false);
    setLoadError(false);
    setSuccess(false);

    if (imgSrc.startsWith("http://") || imgSrc.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    } else {
      img.removeAttribute("crossorigin");
    }

    img.onload = () => {
      setLoaded(true);
      setLoadError(false);
      const maxX = canvasWidth - pieceSize - 10;
      const maxY = canvasHeight - pieceSize - 10;
      const tx = Math.floor(Math.random() * (maxX * 0.6)) + Math.floor(maxX * 0.3);
      const ty = Math.floor(Math.random() * (maxY - 10)) + 5;
      setTarget({ x: tx, y: ty });
      setPiecePosition(10);
      setSuccess(false);
    };
    img.onerror = () => {
      setLoaded(false);
      setLoadError(true);
    };
    img.src = imgSrc;
  }, [imgSrc, canvasWidth, canvasHeight, pieceSize]);

  // Calculate the actual visual position of the piece
  const getPieceVisualX = useCallback(() => {
    return piecePosition;
  }, [piecePosition]);

  // Check if piece fits in the target position
  const checkFit = useCallback((currentX: number): boolean => {
    const visualX = currentX;
    return Math.abs(visualX - target.x) <= tolerance;
  }, [target.x, tolerance]);

  // Draw everything
  const drawAll = useCallback(() => {
    if (!loaded) return;
    const img = imgRef.current;
    const bg = bgRef.current;
    const piece = pieceRef.current;
    if (!bg || !piece) return;

    const visualX = getPieceVisualX();
    const isFitted = checkFit(visualX);

    // Draw background with cutout
    const bctx = bg.getContext("2d");
    if (!bctx) return;
    bctx.clearRect(0, 0, canvasWidth, canvasHeight);
    bctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

    // Create cutout in background
    bctx.save();
    puzzlePath(bctx, target.x, target.y, pieceSize);
    bctx.globalCompositeOperation = "destination-out";
    bctx.fill();
    bctx.restore();
    
     // Outline the cutout
     bctx.save();
     puzzlePath(bctx, target.x, target.y, pieceSize);
     bctx.lineWidth = 3;
     bctx.strokeStyle = isFitted ? "rgba(76, 175, 80, 1)" : darkMode ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.7)";
     bctx.stroke();
     bctx.restore();

    // Draw movable piece
    const pctx = piece.getContext("2d");
    if (!pctx) return;
    pctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw the piece image at its current position
    pctx.save();
    puzzlePath(pctx, visualX, target.y, pieceSize);
    pctx.clip();
      pctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    pctx.restore();

     // Draw piece border
     pctx.save();
     puzzlePath(pctx, visualX, target.y, pieceSize);
     pctx.lineWidth = 3;
     pctx.strokeStyle = isFitted ? "rgba(76, 175, 80, 1)" : darkMode ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.6)";
     pctx.stroke();
     pctx.restore();

    // Draw shadow only when not fitted
    if (!isFitted) {
      pctx.save();
      pctx.beginPath();
      pctx.ellipse(visualX + pieceSize/2, target.y + pieceSize + 6, pieceSize/3, 6, 0, 0, Math.PI*2);
      pctx.fillStyle = "rgba(0,0,0,0.12)";
      pctx.fill();
      pctx.restore();
    }
  }, [loaded, getPieceVisualX, checkFit, canvasWidth, canvasHeight, puzzlePath, target, pieceSize, darkMode]);

  // Redraw when piece moves or target changes
  useEffect(() => {
    drawAll();
  }, [piecePosition, target, drawAll]);

  // Pointer handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (success) return;
      e.preventDefault();
      setDragging(true);
      const clientX = (e as MouseEvent).clientX ?? ((e as TouchEvent).touches[0].clientX);
      startXRef.current = clientX;
      pieceStartXRef.current = piecePosition;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging || success) return;
      const clientX = (e as MouseEvent).clientX ?? ((e as TouchEvent).touches[0].clientX);
      const dx = clientX - startXRef.current;
      let newPosition = pieceStartXRef.current + dx;
      
      // Constrain movement within bounds
      const minX = 10;
      const maxX = canvasWidth - pieceSize - 10;
      newPosition = Math.max(minX, Math.min(newPosition, maxX));
      
      setPiecePosition(Math.round(newPosition));

      // Check for fit
      if (checkFit(newPosition)) {
        setSuccess(true);
        setDragging(false);
        setPiecePosition(target.x); // Snap to exact target
        onSuccess({ x: target.x, y: target.y });
      }
    };

    const onPointerUp = () => {
      if (!dragging || success) return;
      setDragging(false);
      
      // Final check
      if (checkFit(piecePosition)) {
        setSuccess(true);
        setPiecePosition(target.x);
        onSuccess({ x: target.x, y: target.y });
      } else {
        // Animate back to start
        const startPos = piecePosition;
        const duration = 300;
        const startTime = performance.now();
        
        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const newPos = startPos + (10 - startPos) * easeOut;
          
          setPiecePosition(Math.round(newPos));
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        requestAnimationFrame(animate);
      }
    };

    // Event listeners
    container.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    container.addEventListener("touchstart", onPointerDown, { passive: false });
    window.addEventListener("touchmove", onPointerMove, { passive: false });
    window.addEventListener("touchend", onPointerUp);

    return () => {
      container.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      container.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
    };
  }, [dragging, piecePosition, success, target, canvasWidth, pieceSize, checkFit, onSuccess]);

  const reset = () => {
    setLoadError(false);
    setLoaded(false);
    const maxX = canvasWidth - pieceSize - 10;
    const maxY = canvasHeight - pieceSize - 10;
    const tx = Math.floor(Math.random() * (maxX * 0.6)) + Math.floor(maxX * 0.3);
    const ty = Math.floor(Math.random() * (maxY - 10)) + 5;
    setTarget({ x: tx, y: ty });
    setPiecePosition(10);
    setSuccess(false);
    const img = imgRef.current;
    if (img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    } else {
      img.src = imgSrc;
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: canvasWidth,
        height: canvasHeight + 56,
        border: success ? "2px solid #4CAF50" : darkMode ? "1px solid #333" : "1px solid #e3e3e3",
        borderRadius: 8,
        overflow: "hidden",
        background: darkMode ? "#1a1a1a" : "#f8f8f8",
        transition: "border-color 0.3s ease",
        userSelect: "none",
        boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.1)",
      }}
      aria-label="drag captcha container"
    >
      {/* Main puzzle area */}
      <div style={{ position: "relative", width: canvasWidth, height: canvasHeight, margin: "0 auto" }}>
      {!loaded && !loadError && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            color: darkMode ? "#ccc" : "#666",
            zIndex: 2,
          }}
        >
          Loading puzzle...
        </div>
      )}
      {loadError && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 12,
            textAlign: "center",
            fontSize: 13,
            color: darkMode ? "#fca5a5" : "#b91c1c",
            zIndex: 2,
          }}
        >
          Could not load verification image. Tap Reset to try again.
        </div>
      )}
      <canvas
          ref={bgRef}
        width={canvasWidth}
        height={canvasHeight}
          style={{ display: "block", position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}
      />
      <canvas
        ref={pieceRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{
            display: "block",
          position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        />
      </div>


      {/* Reset button */}
      <button
        onClick={reset}
          style={{
            position: "absolute",
          bottom: 8,
          right: 8,
          border: "none",
          background: darkMode ? "#333" : "rgba(255,255,255,0.9)",
            cursor: "pointer",
          padding: "6px 12px",
          borderRadius: 16,
          color: success ? "#4CAF50" : darkMode ? "#fff" : "#333",
          fontWeight: success ? "bold" : "normal",
          fontSize: 12,
          boxShadow: darkMode ? "0 1px 3px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.1)",
        }}
        aria-label="reset captcha"
      >
        {success ? "✓ Done" : "↻ Reset"}
      </button>


      {/* Status text */}
      <div style={{ 
        position: "absolute", 
        bottom: 8, 
        left: 50, 
        right: 80, 
        fontSize: 12, 
        color: success ? "#4CAF50" : darkMode ? "#ccc" : "#666", 
        fontWeight: success ? "bold" : "normal",
        textAlign: "center"
      }}>
        {success ? "Verification complete!" : "Drag the piece into the gap to verify."}
      </div>
    </div>
  );
}