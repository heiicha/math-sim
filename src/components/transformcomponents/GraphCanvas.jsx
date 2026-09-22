import { useEffect, useRef } from "react";
import p5 from "p5";
import "./GraphCanvas.css";

function readColors() {
  const style = getComputedStyle(document.documentElement);
  const get = (name) => style.getPropertyValue(name).trim();
  return {
    original: get("--vec-a") || "#e4b980",
    result: get("--result") || "#6aedcc",
    accent: get("--accent") || "#4cc9f0",
    text: get("--text") || "#e9f0f7",
    dim: get("--text-dim") || "#7f95ac",
    canvasBg: get("--canvas-bg") || "#5e6770",
    grid: get("--canvas-grid") || "rgba(4, 4, 4, 0.15)",
    axis: get("--canvas-axis") || "rgb(0, 0, 0)",
  };
}

function drawGrid(p, ox, oy, unit, colors) {
  p.stroke(colors.grid);
  p.strokeWeight(1);
  for (let x = ox % unit; x < p.width; x += unit) p.line(x, 0, x, p.height);
  for (let y = oy % unit; y < p.height; y += unit) p.line(0, y, p.width, y);
}

function drawAxes(p, ox, oy, w, h, colors, unit) {
  p.stroke(colors.axis);
  p.strokeWeight(1.5);
  p.line(0, oy, w, oy);
  p.line(ox, 0, ox, h);

  if (unit > 18) {
    p.push();
    p.noStroke();
    p.fill(colors.dim);
    p.textFont("'JetBrains Mono', monospace");
    p.textSize(11);
    p.textAlign(p.CENTER, p.TOP);
    const startX = Math.ceil(-ox / unit);
    const endX = Math.floor((w - ox) / unit);
    for (let i = startX; i <= endX; i++) {
      if (i === 0) continue;
      p.text(String(i), ox + i * unit, oy + 4);
    }
    p.textAlign(p.RIGHT, p.CENTER);
    const startY = Math.ceil((oy - h) / unit);
    const endY = Math.floor(oy / unit);
    for (let j = startY; j <= endY; j++) {
      if (j === 0) continue;
      p.text(String(j), ox - 6, oy - j * unit);
    }
    p.pop();
  }

  p.push();
  p.noStroke();
  p.fill(colors.dim);
  p.textFont("'JetBrains Mono', monospace");
  p.textSize(14);
  p.textAlign(p.RIGHT, p.BOTTOM);
  p.text("x", w - 6, oy - 6);
  p.textAlign(p.LEFT, p.TOP);
  p.text("y", ox + 6, 6);
  p.pop();
}

// Samples the function across every screen column and strokes a path,
// breaking the line wherever the value is non-finite or blows up (keeps
// asymptotes like 1/x or tan(x) from being joined into a vertical spike).
function plotCurve(p, fn, origin, unit, colorHex, weight, dashed) {
  const ctx = p.drawingContext;
  ctx.save();
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = weight;
  ctx.setLineDash(dashed ? [5, 4] : []);
  ctx.beginPath();
  const w = p.width;
  const breakThreshold = p.height * 6;
  let started = false;
  for (let sx = 0; sx <= w; sx += 1) {
    const worldX = (sx - origin.x) / unit;
    let worldY;
    try {
      worldY = fn(worldX);
    } catch {
      worldY = NaN;
    }
    const sy = origin.y - worldY * unit;
    const valid = Number.isFinite(worldY) && Math.abs(sy - origin.y) < breakThreshold;
    if (valid) {
      if (!started) {
        ctx.moveTo(sx, sy);
        started = true;
      } else {
        ctx.lineTo(sx, sy);
      }
    } else {
      started = false;
    }
  }
  ctx.stroke();
  ctx.restore();
}

function drawHover(p, hoverX, origin, unit, colors, fn) {
  const sx = origin.x + hoverX * unit;
  p.push();
  p.drawingContext.save();
  p.drawingContext.setLineDash([3, 3]);
  p.stroke(colors.dim);
  p.strokeWeight(1);
  p.line(sx, 0, sx, p.height);
  p.drawingContext.restore();
  p.pop();

  if (!fn) return;
  let y;
  try {
    y = fn(hoverX);
  } catch {
    y = NaN;
  }
  if (!Number.isFinite(y)) return;

  const sy = origin.y - y * unit;
  p.push();
  p.noStroke();
  p.fill(colors.result);
  p.circle(sx, sy, 7);
  p.pop();

  const label = `(${hoverX.toFixed(2)}, ${y.toFixed(2)})`;
  const nearRight = sx > p.width - 130;
  p.push();
  p.noStroke();
  p.fill(colors.text);
  p.textFont("'JetBrains Mono', monospace");
  p.textSize(12);
  p.textAlign(nearRight ? p.RIGHT : p.LEFT, p.BOTTOM);
  p.text(label, nearRight ? sx - 8 : sx + 8, Math.max(14, sy - 8));
  p.pop();
}

export default function GraphCanvas({ baseFn, transformedFn, showOriginal = true }) {
  const containerRef = useRef(null);
  const stateRef = useRef({ baseFn, transformedFn, showOriginal });
  stateRef.current = { baseFn, transformedFn, showOriginal };

  useEffect(() => {
    const container = containerRef.current;
    let pan = { x: 0, y: 0 };
    let unit = 42;
    let panning = false;
    let panStart = null;
    let hoverX = null;
    let colors = readColors();
    let p5Instance;

    const sketch = (p) => {
      const getOrigin = () => ({ x: p.width / 2 + pan.x, y: p.height / 2 + pan.y });

      p.setup = () => {
        const w = container.clientWidth;
        const h = Math.min(520, Math.max(340, w * 0.68));
        p.createCanvas(w, h).parent(container);
      };

      p.draw = () => {
        colors = readColors();
        const { baseFn, transformedFn, showOriginal } = stateRef.current;
        const origin = getOrigin();

        p.background(colors.canvasBg);
        drawGrid(p, origin.x, origin.y, unit, colors);
        drawAxes(p, origin.x, origin.y, p.width, p.height, colors, unit);

        if (baseFn && showOriginal) plotCurve(p, baseFn, origin, unit, colors.dim, 1.5, true);
        if (transformedFn) plotCurve(p, transformedFn, origin, unit, colors.result, 3, false);

        if (hoverX !== null) drawHover(p, hoverX, origin, unit, colors, transformedFn);
      };

      p.mousePressed = () => {
        if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return;
        panning = true;
        panStart = { x: p.mouseX, y: p.mouseY, panX: pan.x, panY: pan.y };
      };

      p.mouseDragged = () => {
        if (panning) {
          pan.x = panStart.panX + (p.mouseX - panStart.x);
          pan.y = panStart.panY + (p.mouseY - panStart.y);
        }
      };

      p.mouseReleased = () => {
        panning = false;
        panStart = null;
      };

      p.mouseMoved = () => {
        if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) {
          hoverX = null;
          return;
        }
        const origin = getOrigin();
        hoverX = (p.mouseX - origin.x) / unit;
      };

      p.mouseWheel = (e) => {
        if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return true;
        const factor = e.delta > 0 ? 0.9 : 1.1;
        unit = Math.min(160, Math.max(10, unit * factor));
        return false;
      };

      p.doubleClicked = () => {
        pan.x = 0;
        pan.y = 0;
        unit = 42;
      };
    };

    p5Instance = new p5(sketch, container);

    const resizeObserver = new ResizeObserver(() => {
      if (!p5Instance) return;
      const w = container.clientWidth;
      const h = Math.min(520, Math.max(340, w * 0.68));
      p5Instance.resizeCanvas(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      p5Instance.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="graph-canvas" ref={containerRef} />;
}
