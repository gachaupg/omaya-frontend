// DragFitCaptcha.tsx
import React, { useRef, useEffect, useState, useCallback } from "react";

interface DragFitCaptchaProps {
  imgSrc: string;
  width?: number;
  height?: number;
  onSuccess?: (result: { x: number; y: number }) => void;
  tolerance?: number;
}

/**
 * DragFitCaptcha
 * Props:
 *  - imgSrc (string) : image URL to use in captcha
 *  - width (number)  : canvas width in px (default 320)
 *  - height (number) : canvas height in px (default 160)
 *  - onSuccess (fn)  : callback when puzzle placed correctly (receives {x, y})
 *  - tolerance (number) : pixels tolerance for success (default 8)
 *
 * Usage:
 *  <DragFitCaptcha imgSrc="/sample.jpg" onSuccess={()=>alert('OK')} />
 */
export default function DragFitCaptcha({
  imgSrc,
  width = 320,
  height = 160,
  onSuccess = () => {},
  tolerance = 8,
}: DragFitCaptchaProps) {
  const bgRef = useRef<HTMLCanvasElement>(null);     // background canvas (with cutout)
  const pieceRef = useRef<HTMLCanvasElement>(null);  // piece canvas (movable)
  const containerRef = useRef<HTMLDivElement>(null);

  const [loaded, setLoaded] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(new Image());
  const [target, setTarget] = useState<{ x: number; y: number }>({ x: 0, y: 0 }); // where piece should fit
  const [pieceX, setPieceX] = useState<number>(0); // current x of piece (left)
  const [dragging, setDragging] = useState<boolean>(false);
  const startXRef = useRef<number>(0); // initial pointer x during drag
  const pieceStartXRef = useRef<number>(0); // initial pieceX when drag starts
  const pieceSize = Math.round(Math.min(width, height) / 4); // puzzle piece size

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

  // initialize image and random target
  useEffect(() => {
    const img = imgRef.current;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setLoaded(true);
      // pick random target within safe bounds
      const maxX = width - pieceSize - 10;
      const maxY = height - pieceSize - 10;
      const tx = Math.floor(Math.random() * (maxX * 0.6)) + Math.floor(maxX * 0.3); // avoid too left/right
      const ty = Math.floor(Math.random() * (maxY - 10)) + 5;
      setTarget({ x: tx, y: ty });
      // initial pieceX: left outside area
      setPieceX(10);
      // draw after state updates
      setTimeout(() => drawAll(tx, ty), 0);
    };
    img.onerror = () => {
      console.error("Failed to load captcha image:", imgSrc);
    };
    img.src = imgSrc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgSrc, width, height, pieceSize]);

  // draw background with hole and draw piece canvas according to pieceX
  const drawAll = useCallback(
    (tx = target.x, ty = target.y) => {
      if (!loaded) return;
      const img = imgRef.current;
      const bg = bgRef.current;
      const piece = pieceRef.current;
      if (!bg || !piece) return;

      // draw background with cutout
      const bctx = bg.getContext("2d");
      if (!bctx) return;
      bctx.clearRect(0, 0, width, height);
      // draw full image
      bctx.drawImage(img, 0, 0, width, height);

      // draw semi-transparent overlay where cutout will be (makes it visible)
      bctx.save();
      puzzlePath(bctx, tx, ty, pieceSize);
      bctx.globalCompositeOperation = "destination-out";
      bctx.fill(); // removes that shape from image
      bctx.restore();
      // outline stroke at cutout
      bctx.save();
      puzzlePath(bctx, tx, ty, pieceSize);
      bctx.lineWidth = 2;
      bctx.strokeStyle = "rgba(255,255,255,0.9)";
      bctx.stroke();
      bctx.restore();

      // draw movable piece on its canvas
      const pctx = piece.getContext("2d");
      if (!pctx) return;
      pctx.clearRect(0, 0, width, height);
      // create mask to copy piece area
      pctx.save();
      // translate so the piece visual stays at pieceX, and we clip the path at its target position
      pctx.translate(pieceX - tx, 0); // align the piece canvas so that it contains the piece image from img
      puzzlePath(pctx, tx, ty, pieceSize);
      pctx.clip();
      // draw the image portion (shifted so only the piece area is visible)
      pctx.drawImage(img, 0, 0, width, height);
      pctx.restore();

      // draw piece border (floating)
      pctx.save();
      pctx.translate(pieceX - tx, 0);
      puzzlePath(pctx, tx, ty, pieceSize);
      pctx.lineWidth = 2;
      pctx.strokeStyle = "rgba(0,0,0,0.4)";
      pctx.stroke();
      pctx.restore();

      // small shadow under piece for depth (drawn on separate layer so it looks floating)
      const shadowX = pieceX;
      const shadowY = ty + pieceSize + 6;
      const sh = piece.getContext("2d");
      if (!sh) return;
      sh.beginPath();
      sh.ellipse(shadowX + pieceSize/2 - tx, shadowY - ty, pieceSize/3, 6, 0, 0, Math.PI*2);
      sh.fillStyle = "rgba(0,0,0,0.12)";
      sh.fill();
    },
    [loaded, pieceX, puzzlePath, target.x, target.y, width, height, pieceSize]
  );

  // redraw on pieceX or target change
  useEffect(() => {
    drawAll();
  }, [pieceX, drawAll, target.x, target.y, loaded]);

  // pointer handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      setDragging(true);
      startXRef.current = (e as MouseEvent).clientX ?? ((e as TouchEvent).touches && (e as TouchEvent).touches[0].clientX);
      pieceStartXRef.current = pieceX;
    };
    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      const clientX = (e as MouseEvent).clientX ?? ((e as TouchEvent).touches && (e as TouchEvent).touches[0].clientX);
      if (typeof clientX !== "number") return;
      const dx = clientX - startXRef.current;
      let nx = pieceStartXRef.current + dx;
      // clamp within container
      const maxLeft = width - pieceSize - 10;
      nx = Math.max(10, Math.min(nx, maxLeft));
      setPieceX(Math.round(nx));
    };
    const onPointerUp = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      setDragging(false);
      // check success
      const distance = Math.abs(pieceX - target.x);
      if (distance <= tolerance) {
        // snap
        setPieceX(target.x);
        onSuccess({ x: target.x, y: target.y });
      } else {
        // animate back to start (simple)
        const start = pieceX;
        const end = 10;
        const duration = 200;
        const t0 = performance.now();
        const step = (t: number) => {
          const p = Math.min(1, (t - t0) / duration);
          const v = start + (end - start) * (1 - Math.pow(1 - p, 3));
          setPieceX(Math.round(v));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    };

    // support mouse and touch
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, pieceX, target, width, pieceSize]);

  // reset function (optional: can be exposed via ref)
  const reset = () => {
    // pick new target and reset piece
    const maxX = width - pieceSize - 10;
    const maxY = height - pieceSize - 10;
    const tx = Math.floor(Math.random() * (maxX * 0.6)) + Math.floor(maxX * 0.3);
    const ty = Math.floor(Math.random() * (maxY - 10)) + 5;
    setTarget({ x: tx, y: ty });
    setPieceX(10);
    setTimeout(() => drawAll(tx, ty), 0);
  };

  return (
    <div style={{ userSelect: "none", width }} >
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width,
          height,
          border: "1px solid #e3e3e3",
          borderRadius: 6,
          overflow: "hidden",
          background: "#f4f4f4",
        }}
        aria-label="drag captcha container"
      >
        {/* Background canvas (with cutout) */}
        <canvas
          ref={bgRef}
          width={width}
          height={height}
          style={{ display: "block", position: "absolute", left: 0, top: 0 }}
        />
        {/* Piece canvas (drawn and positioned) */}
        <canvas
          ref={pieceRef}
          width={width}
          height={height}
          style={{
            display: "block",
            position: "absolute",
            left: 0,
            top: 0,
            pointerEvents: "none", // pointer handled by container
            transform: `translateX(${pieceX}px)`,
            transition: dragging ? "none" : "transform 120ms ease",
            willChange: "transform",
          }}
        />
        {/* slider rail + knob (visual draggable UI) */}
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            right: 8,
            height: 36,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.85)",
            borderRadius: 18,
            padding: "4px 8px",
            boxSizing: "border-box",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            fontSize: 13,
          }}
        >
          <div style={{ flex: 1, height: 20, background: "#f1f1f1", borderRadius: 10, position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: `${((pieceX - 10) / (width - pieceSize - 20)) * 100}%`,
                top: -6,
                width: 44,
                height: 32,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "grab",
                transform: "translateX(-50%)",
                background: "#ffffff",
                border: "1px solid #ddd",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                pointerEvents: "auto",
                userSelect: "none",
              }}
              onMouseDown={(e) => {
                // delegate to container's pointerdown by synthesizing event target
                if (containerRef.current) {
                  const ev = new MouseEvent("mousedown", {
                    clientX: e.clientX,
                    clientY: e.clientY,
                    button: e.button,
                    buttons: e.buttons,
                    ctrlKey: e.ctrlKey,
                    shiftKey: e.shiftKey,
                    altKey: e.altKey,
                    metaKey: e.metaKey,
                  });
                  containerRef.current.dispatchEvent(ev);
                }
              }}
              onTouchStart={(e) => {
                if (containerRef.current) {
                  const ev = new TouchEvent("touchstart", { 
                    touches: Array.from(e.touches) as Touch[],
                    changedTouches: Array.from(e.changedTouches) as Touch[],
                    targetTouches: Array.from(e.targetTouches) as Touch[],
                  });
                  containerRef.current.dispatchEvent(ev);
                }
              }}
              aria-hidden
              title="Drag to fit"
            >
              ⬤
            </div>
          </div>
          <button
            onClick={reset}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: 6,
            }}
            aria-label="reset captcha"
          >
            ↻ Reset
          </button>
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
        Drag the piece into the gap to verify.
      </div>
    </div>
  );
}
