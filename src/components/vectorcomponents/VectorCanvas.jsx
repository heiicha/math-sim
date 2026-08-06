import { useEffect, useRef } from "react";
import p5 from "p5";
import {
  dot,
  crossProduct,
  angleBetween,
  scalarProjection,
  vectorProjection,
  perpendicularComponent,
  add,
  subtract,
  magnitude,
  sectionFormula,
  toDegrees,
  vectorRelationship,
} from "./vectorMath.js";
import "./VectorCanvas.css";

const UNIT = 42;
const HANDLE_R = 8;
const HIT_R = 16;
const LINE_HIT_R = 8;

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-9) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function components(v) {
  return {
    x: v.head.x - v.tail.x,
    y: v.head.y - v.tail.y,
    z: (v.head.z || 0) - (v.tail.z || 0),
  };
}

function readColors() {
  const style = getComputedStyle(document.documentElement);
  const get = (name) => style.getPropertyValue(name).trim();
  return {
    vecA: get("--vec-a") || "#e4b980",
    vecB: get("--vec-b") || "#c77dff",
    vecC: get("--vec-c") || "#5fae6b",
    vecD: get("--vec-d") || "#e0a23d",
    result: get("--result") || "#6aedcc",
    accent: get("--accent") || "#4cc9f0",
    text: get("--text") || "#e9f0f7",
    dim: get("--text-dim") || "#7f95ac",
    canvasBg: get("--canvas-bg") || "#5e6770",
    grid: "rgba(4, 4, 4, 0.15)",
    axis: "rgb(0, 0, 0)",
    negative: "#ff6347",
  };
}

export default function VectorCanvas({
  mode,
  vecA,
  setVecA,
  vecB,
  setVecB,
  vecC,
  setVecC,
  vecD,
  setVecD,
  crossShape,
  ratio,
}) {
  const containerRef = useRef(null);
  const stateRef = useRef({ mode, vecA, vecB, setVecA, setVecB, vecC, setVecC, vecD, setVecD, crossShape, ratio });
  stateRef.current = { mode, vecA, vecB, setVecA, setVecB, vecC, setVecC, vecD, setVecD, crossShape, ratio };

  useEffect(() => {
    const container = containerRef.current;
    let dragging = null;
    let lineDragStart = null;
    let panning = false;
    let panStart = null;
    let pan = { x: 0, y: 0 };
    let colors = readColors();
    let p5Instance;

    const sketch = (p) => {
      const getOrigin = () => ({ x: p.width / 2 + pan.x, y: p.height / 2 + pan.y });
      const toScreen = (v, origin) => ({
        x: origin.x + v.x * UNIT,
        y: origin.y - v.y * UNIT,
      });
      const toWorld = (sx, sy, origin) => ({
        x: (sx - origin.x) / UNIT,
        y: -(sy - origin.y) / UNIT,
      });

      p.setup = () => {
        const w = container.clientWidth;
        const h = Math.min(520, Math.max(340, w * 0.68));
        p.createCanvas(w, h).parent(container);
      };

      // The full list of vectors currently on screen: a and b always, plus
      // c and/or d when the student has added them (Addition mode only).
      function getEntities(state) {
        return [
          { key: "a", vec: state.vecA, setVec: state.setVecA, color: colors.vecA, label: "a" },
          { key: "b", vec: state.vecB, setVec: state.setVecB, color: colors.vecB, label: "b" },
          ...(state.vecC ? [{ key: "c", vec: state.vecC, setVec: state.setVecC, color: colors.vecC, label: "c" }] : []),
          ...(state.vecD ? [{ key: "d", vec: state.vecD, setVec: state.setVecD, color: colors.vecD, label: "d" }] : []),
        ];
      }

      p.draw = () => {
        const state = stateRef.current;
        const { mode, vecA, vecB, vecC, crossShape, ratio } = state;
        const origin = getOrigin();
        const entities = getEntities(state);

        p.background(colors.canvasBg);
        drawGrid(p, origin.x, origin.y);
        drawAxes(p, origin.x, origin.y, p.width, p.height, colors);

        const aTailS = toScreen(vecA.tail, origin);
        const aHeadS = toScreen(vecA.head, origin);
        const bHeadS = toScreen(vecB.head, origin);

        const aComp = components(vecA);
        const bComp = components(vecB);
        const anchor = aTailS;
        const aForOverlay = aHeadS;
        const bForOverlay = {
          x: anchor.x + bComp.x * UNIT,
          y: anchor.y - bComp.y * UNIT,
        };

        if (mode === "dot") {
          drawDotMode(p, aComp, bComp, aForOverlay, bForOverlay, anchor.x, anchor.y, colors);
        } else if (mode === "cross") {
          drawCrossMode(
            p,
            aComp,
            bComp,
            aForOverlay,
            bForOverlay,
            anchor.x,
            anchor.y,
            colors,
            crossShape
          );
        } else if (mode === "addition") {
          drawAdditionMode(p, entities, anchor.x, anchor.y, colors);
        } else if (mode === "subtraction") {
          drawSubtractionMode(p, aComp, bComp, aForOverlay, bForOverlay, anchor.x, anchor.y, colors);
        } else if (mode === "projection") {
          drawProjectionMode(p, aComp, bComp, aForOverlay, bForOverlay, anchor.x, anchor.y, colors);
        } else if (mode === "ratio") {
          drawRatioMode(p, vecA.head, vecB.head, aHeadS, bHeadS, origin, ratio, colors);
        } else if (mode === "collinear" && vecC) {
          const cHeadS = toScreen(vecC.head, origin);
          drawCollinearMode(p, vecA.head, vecB.head, vecC.head, aHeadS, bHeadS, cHeadS, colors);
        }

        entities.forEach((e) => {
          const tailS = toScreen(e.vec.tail, origin);
          const headS = toScreen(e.vec.head, origin);
          drawVectorArrow(p, tailS.x, tailS.y, headS, e.color, e.label);
          drawHandle(p, tailS, e.color, dragging === `${e.key}-tail`, true);
          drawHandle(p, headS, e.color, dragging === `${e.key}-head`, false);
        });
      };

      function drawGrid(p, ox, oy) {
        p.stroke(colors.grid);
        p.strokeWeight(1);
        for (let x = ox % UNIT; x < p.width; x += UNIT) p.line(x, 0, x, p.height);
        for (let y = oy % UNIT; y < p.height; y += UNIT) p.line(0, y, p.width, y);
      }

      p.mousePressed = () => {
        if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return;
        const state = stateRef.current;
        const entities = getEntities(state);
        const origin = getOrigin();

        const candidates = entities.flatMap((e) => [
          { key: `${e.key}-tail`, pt: toScreen(e.vec.tail, origin) },
          { key: `${e.key}-head`, pt: toScreen(e.vec.head, origin) },
        ]);

        let closest = null;
        let closestDist = Infinity;
        for (const c of candidates) {
          const d = p.dist(p.mouseX, p.mouseY, c.pt.x, c.pt.y);
          if (d <= HIT_R && d < closestDist) {
            closest = c.key;
            closestDist = d;
          }
        }

        if (closest) {
          dragging = closest;
          return;
        }

        let lineKey = null;
        let lineDist = Infinity;
        entities.forEach((e) => {
          const tailS = toScreen(e.vec.tail, origin);
          const headS = toScreen(e.vec.head, origin);
          const d = distToSegment(p.mouseX, p.mouseY, tailS.x, tailS.y, headS.x, headS.y);
          if (d <= LINE_HIT_R && d < lineDist) {
            lineDist = d;
            lineKey = e.key;
          }
        });
        if (lineKey) {
          const vec = entities.find((e) => e.key === lineKey).vec;
          dragging = `${lineKey}-line`;
          lineDragStart = {
            startWorld: toWorld(p.mouseX, p.mouseY, origin),
            origTail: { ...vec.tail },
            origHead: { ...vec.head },
          };
          return;
        }

        panning = true;
        panStart = { x: p.mouseX, y: p.mouseY, panX: pan.x, panY: pan.y };
      };

      p.mouseDragged = () => {
        if (typeof dragging === "string" && dragging.endsWith("-line")) {
          const key = dragging.slice(0, dragging.length - "-line".length);
          const origin = getOrigin();
          const worldNow = toWorld(p.mouseX, p.mouseY, origin);
          const delta = {
            x: worldNow.x - lineDragStart.startWorld.x,
            y: worldNow.y - lineDragStart.startWorld.y,
          };
          const rawTail = {
            x: lineDragStart.origTail.x + delta.x,
            y: lineDragStart.origTail.y + delta.y,
          };
          const snappedTail = {
            x: Math.round(rawTail.x * 5) / 5,
            y: Math.round(rawTail.y * 5) / 5,
          };
          // apply the same (snapped) delta to the head so the vector's
          // shape (its component values) never drifts while translating
          const actualDelta = {
            x: snappedTail.x - lineDragStart.origTail.x,
            y: snappedTail.y - lineDragStart.origTail.y,
          };
          const newHead = {
            x: lineDragStart.origHead.x + actualDelta.x,
            y: lineDragStart.origHead.y + actualDelta.y,
          };
          const entity = getEntities(stateRef.current).find((e) => e.key === key);
          if (!entity) return;
          entity.setVec({
            tail: { ...snappedTail, z: entity.vec.tail.z || 0 },
            head: { ...newHead, z: entity.vec.head.z || 0 },
          });
          return;
        }
        if (dragging) {
          const [key, part] = dragging.split("-");
          const origin = getOrigin();
          const world = toWorld(p.mouseX, p.mouseY, origin);
          const snapped = {
            x: Math.round(world.x * 5) / 5,
            y: Math.round(world.y * 5) / 5,
          };
          const entity = getEntities(stateRef.current).find((e) => e.key === key);
          if (!entity) return;
          entity.setVec({ ...entity.vec, [part]: { ...snapped, z: entity.vec[part].z || 0 } });
          return;
        }
        if (panning) {
          pan.x = panStart.panX + (p.mouseX - panStart.x);
          pan.y = panStart.panY + (p.mouseY - panStart.y);
        }
      };

      p.mouseReleased = () => {
        dragging = null;
        lineDragStart = null;
        panning = false;
        panStart = null;
      };

      p.doubleClicked = () => {
        pan.x = 0;
        pan.y = 0;
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

  return <div className="vector-canvas" ref={containerRef} />;
}

function drawAxes(p, ox, oy, w, h, colors) {
  p.stroke(colors.axis);
  p.strokeWeight(1.5);
  p.line(0, oy, w, oy);
  p.line(ox, 0, ox, h);

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

function drawVectorArrow(p, ox, oy, tip, colorHex, label) {
  p.push();
  p.stroke(colorHex);
  p.strokeWeight(3);
  p.line(ox, oy, tip.x, tip.y);

  const angle = Math.atan2(tip.y - oy, tip.x - ox);
  const arrowSize = 11;
  p.noStroke();
  p.fill(colorHex);
  p.translate(tip.x, tip.y);
  p.rotate(angle);
  p.triangle(0, 0, -arrowSize, arrowSize / 2.2, -arrowSize, -arrowSize / 2.2);
  p.pop();

  p.push();
  p.noStroke();
  p.fill(colorHex);
  p.textFont("Open Sans, Bold");
  p.textSize(26);
  const offX = tip.x >= ox ? 14 : -26;
  const offY = tip.y <= oy ? -8 : 22;
  p.text(label, tip.x + offX, tip.y + offY);
  p.pop();
}

function drawHandle(p, pos, colorHex, active, isTail) {
  p.push();
  if (isTail) {
    p.noFill();
    p.stroke(active ? 255 : colorHex);
    p.strokeWeight(2);
    const s = active ? HANDLE_R * 1.8 : HANDLE_R * 1.4;
    p.rectMode(p.CENTER);
    p.rect(pos.x, pos.y, s, s, 2);
  } else {
    p.noStroke();
    p.fill(active ? 255 : colorHex);
  }
  if (active) {
    p.noFill();
    p.stroke(colorHex);
    p.strokeWeight(2);
  }
  p.pop();
}

function drawDotMode(p, vecA, vecB, aS, bS, ox, oy, colors) {
  const value = dot(vecA, vecB);
  const theta = angleBetween(vecA, vecB);
  const degrees = toDegrees(theta);
  const screenA = Math.atan2(aS.y - oy, aS.x - ox);
  const screenB = Math.atan2(bS.y - oy, bS.x - ox);
  let diff = screenB - screenA;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const arcR = 46;
  p.push();
  p.noFill();
  p.stroke(colors.accent);
  p.strokeWeight(2);
  if (diff >= 0) p.arc(ox, oy, arcR * 2, arcR * 2, screenA, screenA + diff);
  else p.arc(ox, oy, arcR * 2, arcR * 2, screenA + diff, screenA);
  p.pop();

  const magB2 = vecB.x * vecB.x + vecB.y * vecB.y;
  if (magB2 > 0) {
    const scale = (vecA.x * vecB.x + vecA.y * vecB.y) / magB2;
    const foot = { x: vecB.x * scale, y: vecB.y * scale };
    const footS = { x: ox + foot.x * UNIT, y: oy - foot.y * UNIT };
    drawDashedLine(p, footS, aS, colors.dim);
    drawDashedLine(p, { x: ox, y: oy }, footS, colors.result, 4);
  }

  p.push();
  p.noStroke();
  p.fill(value >= 0 ? colors.result : colors.negative);
  p.textFont("'JetBrains Mono', monospace");
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`a · b = ${value.toFixed(2)}`, 14, 14);
  p.fill(colors.dim);
  p.textSize(13);
  p.text(`θ = ${degrees.toFixed(1)}°`, 14, 38);
  p.pop();
}

function drawCrossMode(p, vecA, vecB, aS, bS, ox, oy, colors, crossShape) {
  const c = crossProduct(vecA, vecB);
  const area = magnitude(c);
  const sum = { x: vecA.x + vecB.x, y: vecA.y + vecB.y };
  const sumS = { x: ox + sum.x * UNIT, y: oy - sum.y * UNIT };
  const shapeColor = area >= 0 ? colors.result : colors.negative;

  p.push();
  const fillColor = p.color(shapeColor);
  fillColor.setAlpha(45);
  p.fill(fillColor);
  p.stroke(shapeColor);
  p.strokeWeight(1.5);
  p.beginShape();
  if (crossShape === "triangle") {
    p.vertex(ox, oy);
    p.vertex(aS.x, aS.y);
    p.vertex(bS.x, bS.y);
  } else {
    p.vertex(ox, oy);
    p.vertex(aS.x, aS.y);
    p.vertex(sumS.x, sumS.y);
    p.vertex(bS.x, bS.y);
  }
  p.endShape(p.CLOSE);
  p.pop();
  p.push();
  p.noFill();
  p.stroke(shapeColor);
  p.strokeWeight(2);
  const r = 26;
  if (c.z >= 0) p.arc(ox, oy, r * 2, r * 2, -Math.PI * 0.6, Math.PI * 0.1);
  else p.arc(ox, oy, r * 2, r * 2, Math.PI * 0.9, Math.PI * 1.6);
  p.pop();

  const parallelogramArea = area;
  const triangleArea = area / 2;

  p.push();
  p.noStroke();
  p.fill(shapeColor);
  p.textFont("'JetBrains Mono', monospace");
  p.textSize(15);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`a × b = ${c.x.toFixed(2)}i + ${c.y.toFixed(2)}j + ${c.z.toFixed(2)}k`, 14, 14);
  p.fill(colors.dim);
  p.textSize(13);
  p.text(`parallelogram area = ${parallelogramArea.toFixed(2)}`, 14, 36);
  p.text(`triangle area = ${triangleArea.toFixed(2)}`, 14, 54);
  p.pop();
}

function drawAdditionMode(p, entities, ox, oy, colors) {
  const comps = entities.map((e) => components(e.vec));
  const result = comps.reduce((acc, c) => add(acc, c), { x: 0, y: 0, z: 0 });
  const resultS = { x: ox + result.x * UNIT, y: oy - result.y * UNIT };
  const sumLabel = entities.map((e) => e.label).join("+");
  const sumLabelSpaced = entities.map((e) => e.label).join(" + ");

  if (entities.length === 2) {
    // exactly a and b (the default) — keep the original parallelogram-style
    // construction: two dashed edges, one a translated copy of each vector.
    const [aComp, bComp] = comps;
    const aS = { x: ox + aComp.x * UNIT, y: oy - aComp.y * UNIT };
    const bS = { x: ox + bComp.x * UNIT, y: oy - bComp.y * UNIT };
    drawDashedLine(p, aS, resultS, colors.vecB);
    drawDashedLine(p, bS, resultS, colors.vecA);
  } else {
    // 3+ vectors: a simple tip-to-tail chain — a's real arrow is the first
    // leg, then each extra vector continues as a dashed translated copy.
    let elbow = { x: ox + comps[0].x * UNIT, y: oy - comps[0].y * UNIT };
    for (let i = 1; i < comps.length; i++) {
      const next = { x: elbow.x + comps[i].x * UNIT, y: elbow.y - comps[i].y * UNIT };
      drawDashedLine(p, elbow, next, entities[i].color);
      elbow = next;
    }
  }

  p.push();
  p.stroke(colors.result);
  p.strokeWeight(3.5);
  p.line(ox, oy, resultS.x, resultS.y);
  const angle = Math.atan2(resultS.y - oy, resultS.x - ox);
  const arrowSize = 11;
  p.noStroke();
  p.fill(colors.result);
  p.translate(resultS.x, resultS.y);
  p.rotate(angle);
  p.triangle(0, 0, -arrowSize, arrowSize / 2.2, -arrowSize, -arrowSize / 2.2);
  p.pop();

  p.push();
  p.noStroke();
  p.fill(colors.result);
  p.textFont("Caveat, cursive");
  p.textSize(24);
  p.text(sumLabel, resultS.x + 12, resultS.y - 8);
  p.pop();

  p.push();
  p.noStroke();
  p.fill(colors.result);
  p.textFont("'JetBrains Mono', monospace");
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text(
    `${sumLabelSpaced} = ${result.x.toFixed(2)}i + ${result.y.toFixed(2)}j + ${result.z.toFixed(2)}k`,
    14,
    14
  );
  p.fill(colors.dim);
  p.textSize(13);
  p.text(`|${sumLabel}| = ${magnitude(result).toFixed(2)}`, 14, 38);
  p.pop();
}

function drawSubtractionMode(p, vecA, vecB, aS, bS, ox, oy, colors) {
  const diff = subtract(vecB, vecA);
  const mag = magnitude(diff);

  // ghost b, anchored at the same tail as a, so both start from a common
  // point — matching the notes' diagram (u = a, v = b, v − u runs tip-to-tip)
  drawDashedLine(p, { x: ox, y: oy }, bS, colors.dim);

  // b − a: the displacement from a's tip to b's tip
  drawVectorArrow(p, aS.x, aS.y, bS, colors.result, "b−a");

  p.push();
  p.noStroke();
  p.fill(colors.result);
  p.textFont("'JetBrains Mono', monospace");
  p.textSize(15);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`b − a = ${diff.x.toFixed(2)}i + ${diff.y.toFixed(2)}j + ${diff.z.toFixed(2)}k`, 14, 14);
  p.fill(colors.dim);
  p.textSize(13);
  p.text(`|b − a| = ${mag.toFixed(2)}`, 14, 34);
  p.pop();
}

function drawProjectionMode(p, vecA, vecB, aS, bS, ox, oy, colors) {
  const projVec = vectorProjection(vecA, vecB);
  const scalarProj = scalarProjection(vecA, vecB);
  const perp = perpendicularComponent(vecA, vecB);
  const projS = { x: ox + projVec.x * UNIT, y: oy - projVec.y * UNIT };

  p.push();
  p.stroke(colors.result);
  p.strokeWeight(5);
  p.line(ox, oy, projS.x, projS.y);
  p.pop();

  // the perpendicular (leftover) component, drawn from the foot of the
  // projection up to a's actual tip
  drawDashedLine(p, projS, aS, colors.dim);

  p.push();
  p.noStroke();
  p.fill(colors.result);
  p.circle(projS.x, projS.y, 9);
  p.pop();

  p.push();
  p.noStroke();
  p.fill(colors.result);
  p.textFont("'JetBrains Mono', monospace");
  p.textSize(15);
  p.textAlign(p.LEFT, p.TOP);
  p.text(
    `u = ${projVec.x.toFixed(2)}i + ${projVec.y.toFixed(2)}j + ${projVec.z.toFixed(2)}k`,
    14,
    14
  );
  p.fill(colors.dim);
  p.textSize(13);
  p.text(`length of projection = ${scalarProj.toFixed(2)}`, 14, 34);
  p.fill(colors.negative);
  p.textSize(15);
  p.text(
    `v = ${perp.x.toFixed(2)}i + ${perp.y.toFixed(2)}j + ${perp.z.toFixed(2)}k`,
    14,
    54
  );
  p.pop();
}

function drawRatioMode(p, pointA, pointB, aS, bS, origin, ratio, colors) {
  const P = sectionFormula(pointA, pointB, ratio.lambda, ratio.mu);
  const pS = { x: origin.x + P.x * UNIT, y: origin.y - P.y * UNIT };

  p.push();
  p.stroke(colors.dim);
  p.strokeWeight(2);
  p.line(aS.x, aS.y, bS.x, bS.y);
  p.pop();

  // P's position vector OP — dashed, so it reads as "derived" the same way
  // the other modes dash their computed/helper vectors
  drawDashedLine(p, { x: origin.x, y: origin.y }, pS, colors.result, 5);

  p.push();
  p.noStroke();
  p.fill(colors.result);
  // diamond marker for P, to distinguish it from the tail/head handles
  p.push();
  p.translate(pS.x, pS.y);
  p.rotate(Math.PI / 4);
  p.rectMode(p.CENTER);
  p.rect(0, 0, 12, 12, 2);
  p.pop();
  p.pop();

  p.push();
  p.noStroke();
  p.fill(colors.result);
  p.textFont("Caveat, cursive");
  p.textSize(24);
  p.text("P", pS.x + 12, pS.y - 8);
  p.pop();

  p.push();
  p.noStroke();
  p.fill(colors.result);
  p.textFont("'JetBrains Mono', monospace");
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`P = ${P.x.toFixed(2)}i + ${P.y.toFixed(2)}j + ${P.z.toFixed(2)}k`, 14, 14);
  p.fill(colors.dim);
  p.textSize(13);
  p.text(`AP : PB = ${ratio.lambda} : ${ratio.mu}`, 14, 38);
  p.pop();
}

function drawCollinearMode(p, pointA, pointB, pointC, aS, bS, cS, colors) {
  const AB = subtract(pointB, pointA);
  const BC = subtract(pointC, pointB);
  const rel = vectorRelationship(AB, BC);
  const collinear = rel === "parallel";

  p.push();
  p.stroke(colors.dim);
  p.strokeWeight(2);
  p.line(aS.x, aS.y, bS.x, bS.y);
  p.line(bS.x, bS.y, cS.x, cS.y);
  p.pop();

  if (collinear) {
    // a solid line through all three, confirming the straight line they share
    p.push();
    p.stroke(colors.result);
    p.strokeWeight(3);
    p.line(aS.x, aS.y, cS.x, cS.y);
    p.pop();
  }

  p.push();
  p.noStroke();
  p.fill(colors.result);
  p.textFont("'JetBrains Mono', monospace");
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text(
    rel === "degenerate" ? "two points coincide" : collinear ? "A, B, C are collinear" : "A, B, C are not collinear",
    14,
    14
  );
  p.fill(colors.dim);
  p.textSize(13);
  p.text(`AB = ${AB.x.toFixed(2)}i + ${AB.y.toFixed(2)}j + ${AB.z.toFixed(2)}k`, 14, 38);
  p.text(`BC = ${BC.x.toFixed(2)}i + ${BC.y.toFixed(2)}j + ${BC.z.toFixed(2)}k`, 14, 56);
  p.pop();
}

function drawDashedLine(p, from, to, colorHex, dash = 6) {
  p.push();
  p.stroke(colorHex);
  p.strokeWeight(1.5);
  const d = p.dist(from.x, from.y, to.x, to.y);
  const steps = Math.max(1, Math.floor(d / dash));
  for (let i = 0; i < steps; i += 2) {
    const t1 = i / steps;
    const t2 = Math.min(1, (i + 1) / steps);
    p.line(
      p.lerp(from.x, to.x, t1),
      p.lerp(from.y, to.y, t1),
      p.lerp(from.x, to.x, t2),
      p.lerp(from.y, to.y, t2)
    );
  }
  p.pop();
}
