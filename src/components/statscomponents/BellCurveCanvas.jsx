import { useEffect, useRef } from "react";
import p5 from "p5";
import { normalPDF } from "../../utils/statsMath";
import "./BellCurveCanvas.css";

// Shared normal-curve renderer for the Normal Distribution and Hypothesis
// Testing topics: draws one or two bell curves over a shared x-domain, with
// optional shaded probability regions and labelled vertical markers
// (critical values, test statistics, means, ...). Static viewport (no
// pan/zoom) since the domain is fully determined by the curve parameters —
// students steer it with sliders, not by dragging the graph.

function readColors() {
  const style = getComputedStyle(document.documentElement);
  const get = (name) => style.getPropertyValue(name).trim();
  return {
    text: get("--text") || "#e9f0f7",
    dim: get("--text-dim") || "#7f95ac",
    accent: get("--accent") || "#4cc9f0",
    result: get("--result") || "#6aedcc",
    canvasBg: get("--canvas-bg") || "#5e6770",
    grid: get("--canvas-grid") || "rgba(4, 4, 4, 0.15)",
    axis: get("--canvas-axis") || "rgb(0, 0, 0)",
  };
}

function fmtTick(n) {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
}

export default function BellCurveCanvas({
  primary,
  secondary = null,
  shade = [],
  markers = [],
  height = 320,
}) {
  const containerRef = useRef(null);
  const stateRef = useRef({ primary, secondary, shade, markers });
  stateRef.current = { primary, secondary, shade, markers };

  useEffect(() => {
    const container = containerRef.current;
    let p5Instance;
    let colors = readColors();

    const sketch = (p) => {
      p.setup = () => {
        const w = container.clientWidth;
        p.createCanvas(w, height).parent(container);
      };

      p.draw = () => {
        colors = readColors();
        const { primary, secondary, shade, markers } = stateRef.current;
        p.background(colors.canvasBg);
        if (!primary || !Number.isFinite(primary.mean) || !Number.isFinite(primary.sd) || primary.sd <= 0) {
          return;
        }

        const curves = [primary, ...(secondary ? [secondary] : [])];
        const lo = Math.min(...curves.map((c) => c.mean - 4.2 * c.sd));
        const hi = Math.max(...curves.map((c) => c.mean + 4.2 * c.sd));
        const w = p.width;
        const h = p.height;
        const padBottom = 28;
        const padTop = 14;
        const plotH = h - padBottom - padTop;

        const toPx = (x) => ((x - lo) / (hi - lo)) * w;
        const maxDensity = normalPDF(primary.mean, primary.mean, primary.sd);
        const toPy = (density) => padTop + plotH - (density / maxDensity) * plotH * 0.92;

        // grid + x-axis ticks
        p.stroke(colors.grid);
        p.strokeWeight(1);
        const tickCount = 9;
        const step = (hi - lo) / tickCount;
        p.push();
        p.noStroke();
        p.fill(colors.dim);
        p.textFont("'JetBrains Mono', monospace");
        p.textSize(10);
        p.textAlign(p.CENTER, p.TOP);
        for (let i = 0; i <= tickCount; i++) {
          const x = lo + i * step;
          const px = toPx(x);
          p.stroke(colors.grid);
          p.line(px, padTop, px, h - padBottom);
          p.noStroke();
          p.fill(colors.dim);
          p.text(fmtTick(x), px, h - padBottom + 6);
        }
        p.pop();

        // baseline
        p.stroke(colors.axis);
        p.strokeWeight(1.5);
        p.line(0, h - padBottom, w, h - padBottom);

        // shaded probability regions (under the primary curve)
        for (const region of shade) {
          const from = Math.max(lo, region.from);
          const to = Math.min(hi, region.to);
          if (to <= from) continue;
          p.push();
          p.noStroke();
          const fillColor = p.color(region.color || colors.accent);
          fillColor.setAlpha(region.alpha ?? 110);
          p.fill(fillColor);
          p.beginShape();
          p.vertex(toPx(from), h - padBottom);
          const steps = 60;
          for (let i = 0; i <= steps; i++) {
            const x = from + ((to - from) * i) / steps;
            p.vertex(toPx(x), toPy(normalPDF(x, primary.mean, primary.sd)));
          }
          p.vertex(toPx(to), h - padBottom);
          p.endShape(p.CLOSE);
          p.pop();
        }

        const plotCurve = (curve, colorHex, dashed) => {
          p.push();
          const ctx = p.drawingContext;
          ctx.save();
          ctx.strokeStyle = colorHex;
          ctx.lineWidth = dashed ? 1.6 : 2.4;
          ctx.setLineDash(dashed ? [5, 4] : []);
          ctx.beginPath();
          const steps = 200;
          for (let i = 0; i <= steps; i++) {
            const x = lo + ((hi - lo) * i) / steps;
            const px = toPx(x);
            const py = toPy(normalPDF(x, curve.mean, curve.sd));
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
          ctx.restore();
          p.pop();
        };

        if (secondary) plotCurve(secondary, colors.dim, true);
        plotCurve(primary, colors.result, false);

        // markers (critical values, test statistic, mean, ...)
        for (const marker of markers) {
          if (marker.x < lo || marker.x > hi) continue;
          const px = toPx(marker.x);
          p.push();
          const ctx = p.drawingContext;
          ctx.save();
          ctx.setLineDash(marker.dashed === false ? [] : [4, 3]);
          p.stroke(marker.color || colors.text);
          p.strokeWeight(1.4);
          p.line(px, padTop, px, h - padBottom);
          ctx.restore();
          p.pop();

          if (marker.label) {
            p.push();
            p.noStroke();
            p.fill(marker.color || colors.text);
            p.textFont("'JetBrains Mono', monospace");
            p.textSize(11);
            p.textAlign(px > w - 60 ? p.RIGHT : px < 60 ? p.LEFT : p.CENTER, p.BOTTOM);
            p.text(marker.label, px, padTop + 12);
            p.pop();
          }
        }
      };
    };

    p5Instance = new p5(sketch, container);

    const resizeObserver = new ResizeObserver(() => {
      if (!p5Instance) return;
      p5Instance.resizeCanvas(container.clientWidth, height);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      p5Instance.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  return <div className="bell-curve-canvas" ref={containerRef} />;
}
