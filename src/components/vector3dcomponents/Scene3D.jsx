import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  linePlaneRelationship,
  lineLineRelationship,
  planePlaneRelationship,
  reflectLineAcrossPlane,
  reflectPlaneAcrossPlane,
  spanningVectors,
  subtract,
  closestPointsOnSkewLines,
} from "./geometry3D.js";
import { magnitude, dot, perpendicularComponent, crossProduct, add } from "../vectorcomponents/vectorMath.js";
import "./Scene3D.css";

const LINE_REACH = 7; // how far each drawn line extends past its defining point
const PLANE_SIZE = 7; // side length of the finite plane patch we draw

function readColors() {
  const style = getComputedStyle(document.documentElement);
  const get = (name) => style.getPropertyValue(name).trim();
  return {
    entity1: get("--vec-a") || "#e4b980",
    entity2: get("--vec-b") || "#6990e4",
    result: get("--result") || "#996ae9",
    accent: get("--accent") || "#2b63da",
    canvasBg: get("--canvas-bg") || get("--panel") || "#ffffff",
    dim: get("--text-dim") || "#7f95ac",
  };
}

// Math (x, y, z) -> three.js (x, z-as-up, y). We treat z as "height" to
// match how these are usually sketched on paper (x, y flat on the desk,
// z pointing up), even though three.js itself defaults to y-up.
function toThree(v) {
  return new THREE.Vector3(v.x, v.z || 0, v.y);
}

function disposeObject(obj) {
  obj.geometry?.dispose();
  if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
  else obj.material?.dispose();
}

function clearGroup(group) {
  for (let i = group.children.length - 1; i >= 0; i--) {
    const child = group.children[i];
    clearGroup(child);
    disposeObject(child);
    group.remove(child);
  }
}

function addInfiniteLine(group, line, colorHex, opacity = 1, dashed = false) {
  const p = toThree(line.point);
  const d = toThree(line.direction).normalize();
  const a = p.clone().addScaledVector(d, -LINE_REACH);
  const b = p.clone().addScaledVector(d, LINE_REACH);
  const geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
  const material = dashed
    ? new THREE.LineDashedMaterial({ color: colorHex, dashSize: 0.25, gapSize: 0.18, transparent: opacity < 1, opacity })
    : new THREE.LineBasicMaterial({ color: colorHex, transparent: opacity < 1, opacity });
  const threeLine = new THREE.Line(geometry, material);
  if (dashed) threeLine.computeLineDistances();
  group.add(threeLine);
  return threeLine;
}

function addSegment(group, pointA, pointB, colorHex, dashed = true) {
  const a = toThree(pointA);
  const b = toThree(pointB);
  const geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
  const material = dashed
    ? new THREE.LineDashedMaterial({ color: colorHex, dashSize: 0.2, gapSize: 0.15 })
    : new THREE.LineBasicMaterial({ color: colorHex });
  const line = new THREE.Line(geometry, material);
  if (dashed) line.computeLineDistances();
  group.add(line);
  return line;
}

function addPoint(group, point, colorHex, radius = 0.11) {
  const geometry = new THREE.SphereGeometry(radius, 16, 16);
  const material = new THREE.MeshBasicMaterial({ color: colorHex });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.copy(toThree(point));
  group.add(sphere);
  return sphere;
}

function addArrow(group, origin, direction, colorHex, length = 1.6) {
  const dir = toThree(direction);
  const mag = dir.length();
  if (mag < 1e-6) return null;
  dir.normalize();
  const arrow = new THREE.ArrowHelper(dir, toThree(origin), length, colorHex, length * 0.28, length * 0.16);
  group.add(arrow);
  return arrow;
}

// Invisible, generously-sized sphere used only for raycasting — the visible
// point/arrow geometry stays tiny and hard to grab, so every draggable
// handle gets one of these layered on top of it.
function addHandle(group, position, kind, entity, field, extra = {}) {
  const geometry = new THREE.SphereGeometry(0.22, 12, 12);
  // opacity:0 (not visible:false) — three.js's Raycaster skips
  // visible:false objects but still hit-tests transparent ones.
  const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.userData = { kind, entity, field, ...extra };
  group.add(mesh);
  return mesh;
}

function addDraggablePoint(group, point, colorHex, radius, entity, field) {
  addPoint(group, point, colorHex, radius);
  addHandle(group, toThree(point), "point", entity, field);
}

function addDraggableArrow(group, origin, direction, colorHex, length, entity, field) {
  addArrow(group, origin, direction, colorHex, length);
  const dir = toThree(direction);
  if (dir.length() < 1e-6) return;
  dir.normalize();
  const tip = toThree(origin).addScaledVector(dir, length);
  addHandle(group, tip, "direction", entity, field, { origin });
}

function addPlane(group, plane, colorHex, opacity = 0.28) {
  const { b, c } = spanningVectors(plane.normal);
  const p = toThree(plane.point);
  const bT = toThree(b);
  const cT = toThree(c);
  const half = PLANE_SIZE / 2;

  const corners = [
    p.clone().addScaledVector(bT, -half).addScaledVector(cT, -half),
    p.clone().addScaledVector(bT, half).addScaledVector(cT, -half),
    p.clone().addScaledVector(bT, half).addScaledVector(cT, half),
    p.clone().addScaledVector(bT, -half).addScaledVector(cT, half),
  ];

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(corners.flatMap((v) => [v.x, v.y, v.z]));
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();

  const material = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);

  // outline so the finite patch reads clearly against the grid
  const edgeGeom = new THREE.BufferGeometry().setFromPoints([...corners, corners[0]]);
  const edgeMat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: Math.min(1, opacity + 0.35) });
  group.add(new THREE.Line(edgeGeom, edgeMat));

  return mesh;
}

// The parallelogram spanned by two vectors anchored at a point — used for
// the line-line cross-product view, where the "plane area" the cross
// product represents is drawn as an actual finite patch rather than just
// a normal arrow.
function addParallelogram(group, anchor, vecA, vecB, colorHex, opacity = 0.35) {
  const p0 = toThree(anchor);
  const dA = toThree(vecA);
  const dB = toThree(vecB);
  const corners = [p0, p0.clone().add(dA), p0.clone().add(dA).add(dB), p0.clone().add(dB)];

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(corners.flatMap((v) => [v.x, v.y, v.z]));
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();

  const material = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);

  const edgeGeom = new THREE.BufferGeometry().setFromPoints([...corners, corners[0]]);
  const edgeMat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: Math.min(1, opacity + 0.35) });
  group.add(new THREE.Line(edgeGeom, edgeMat));

  return mesh;
}

// Sweeps a small arc between two directions at `vertex`, in the plane they
// span. The sweep magnitude is always taken from the already-computed
// `angleDeg` (the same number shown in ReadoutPanel3D) rather than
// recomputed from u/v here, so the arc can never visually disagree with the
// readout — u/v only decide the rotation axis/orientation.
function addAngleArc(group, vertex, uDir, vDir, angleDeg, colorHex, radius = 0.8, segments = 40) {
  if (!angleDeg || angleDeg < 0.5) return null;
  const u = uDir.clone().normalize();
  const v = vDir.clone().normalize();
  const axis = new THREE.Vector3().crossVectors(u, v);
  if (axis.lengthSq() < 1e-8) return null; // (anti)parallel — no sweep plane
  axis.normalize();
  const angleRad = THREE.MathUtils.degToRad(angleDeg);
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * angleRad;
    points.push(u.clone().applyAxisAngle(axis, t).multiplyScalar(radius).add(vertex));
  }
  // A plain THREE.Line here would be stuck at ~1px on most GPUs (WebGL
  // clamps LineBasicMaterial's linewidth) — a thin tube along the same
  // curve gives a genuinely thick, visible arc instead.
  const curve = new THREE.CatmullRomCurve3(points);
  const tubeGeometry = new THREE.TubeGeometry(curve, segments, 0.035, 6, false);
  const material = new THREE.MeshBasicMaterial({ color: colorHex });
  const tube = new THREE.Mesh(tubeGeometry, material);
  // deliberately no userData.kind — stays outside Feature 5's raycast filter
  group.add(tube);
  return tube;
}

function buildAxes(group) {
  const axisLen = 8;
  const specs = [
    { dir: new THREE.Vector3(1, 0, 0), color: 0xb8b8b8 }, // math x
    { dir: new THREE.Vector3(0, 1, 0), color: 0xb8b8b8 }, // math z (up)
    { dir: new THREE.Vector3(0, 0, 1), color: 0xb8b8b8 }, // math y
  ];
  specs.forEach(({ dir, color }) => {
    const a = dir.clone().multiplyScalar(-axisLen);
    const b = dir.clone().multiplyScalar(axisLen);
    const geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 });
    group.add(new THREE.Line(geometry, material));
  });
}

export default function Scene3D({
  mode,
  line1,
  setLine1,
  line2,
  setLine2,
  plane1,
  setPlane1,
  plane2,
  setPlane2,
  planePlaneView,
  linePlaneView,
  lineLineView,
}) {
  const containerRef = useRef(null);
  const stateRef = useRef({
    mode,
    line1,
    setLine1,
    line2,
    setLine2,
    plane1,
    setPlane1,
    plane2,
    setPlane2,
    planePlaneView,
    linePlaneView,
    lineLineView,
  });
  stateRef.current = {
    mode,
    line1,
    setLine1,
    line2,
    setLine2,
    plane1,
    setPlane1,
    plane2,
    setPlane2,
    planePlaneView,
    linePlaneView,
    lineLineView,
  };

  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const dynamicGroupRef = useRef(null);

  // one-time scene setup
  useEffect(() => {
    const container = containerRef.current;
    const colors = readColors();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(colors.canvasBg);
    sceneRef.current = scene;

    const w = container.clientWidth;
    const h = Math.min(560, Math.max(380, w * 0.7));

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 200);
    camera.position.set(9, 7, 10);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    const grid = new THREE.GridHelper(16, 16, 0xd0d0d0, 0xe6e6e6);
    scene.add(grid);

    const staticGroup = new THREE.Group();
    buildAxes(staticGroup);
    scene.add(staticGroup);

    const dynamicGroup = new THREE.Group();
    dynamicGroupRef.current = dynamicGroup;
    scene.add(dynamicGroup);

    // ---- drag-to-edit: raycast against invisible handle spheres on the
    // draggable points/arrow-tips, added by addDraggablePoint/addDraggableArrow
    // during the mode-rebuild effect below. ----
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let dragTarget = null; // plain copy of a handle's userData, never the mesh itself
    const dragPlane = new THREE.Plane();
    const hitPoint = new THREE.Vector3();

    const threeToMath = (v) => ({ x: v.x, y: v.z, z: v.y });
    const snap = (v, step = 0.2) => ({
      x: Math.round(v.x / step) * step,
      y: Math.round(v.y / step) * step,
      z: Math.round(v.z / step) * step,
    });

    function applyDrag({ entity, field, origin }, worldHit) {
      const s = stateRef.current;
      const setters = {
        line1: s.setLine1,
        line2: s.setLine2,
        plane1: s.setPlane1,
        plane2: s.setPlane2,
      };
      const current = { line1: s.line1, line2: s.line2, plane1: s.plane1, plane2: s.plane2 };
      const setFn = setters[entity];
      if (!setFn) return;

      if (field === "point") {
        setFn({ ...current[entity], point: snap(threeToMath(worldHit)) });
        return;
      }
      // direction / normal: derive from the captured origin -> new hit point,
      // guarding against collapsing to a near-zero (degenerate) vector.
      const newVec = subtract(threeToMath(worldHit), origin);
      if (magnitude(newVec) < 0.3) return;
      setFn({ ...current[entity], [field]: snap(newVec) });
    }

    function toNDC(evt) {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.x = ((evt.clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -((evt.clientY - r.top) / r.height) * 2 + 1;
    }

    function pickHandle(evt) {
      toNDC(evt);
      raycaster.setFromCamera(ndc, camera);
      const handles = dynamicGroupRef.current.children.filter((c) => c.userData?.kind);
      return raycaster.intersectObjects(handles, false)[0]?.object ?? null;
    }

    function onPointerDown(evt) {
      const hit = pickHandle(evt);
      if (!hit) return; // let it bubble to OrbitControls for orbiting
      evt.stopPropagation();
      dragTarget = { ...hit.userData };
      controls.enabled = false;
      const p0 = hit.getWorldPosition(new THREE.Vector3());
      const camDir = camera.getWorldDirection(new THREE.Vector3());
      dragPlane.setFromNormalAndCoplanarPoint(camDir, p0);
      renderer.domElement.setPointerCapture(evt.pointerId);
    }
    function onPointerMove(evt) {
      if (!dragTarget) return;
      toNDC(evt);
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(dragPlane, hitPoint)) applyDrag(dragTarget, hitPoint);
    }
    function onPointerUp(evt) {
      if (dragTarget) renderer.domElement.releasePointerCapture(evt.pointerId);
      dragTarget = null;
      controls.enabled = true;
    }
    // capture:true so this runs before OrbitControls' own bubble-phase
    // pointerdown listener on the same element — otherwise orbiting would
    // already have started by the time we disable controls.
    renderer.domElement.addEventListener("pointerdown", onPointerDown, { capture: true });
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver = new ResizeObserver(() => {
      const nw = container.clientWidth;
      const nh = Math.min(560, Math.max(380, nw * 0.7));
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown, { capture: true });
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      controls.dispose();
      clearGroup(dynamicGroup);
      clearGroup(staticGroup);
      clearGroup(grid);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // rebuild the mode-specific content whenever anything relevant changes
  useEffect(() => {
    const group = dynamicGroupRef.current;
    if (!group) return;
    clearGroup(group);
    const colors = readColors();
    const { mode, line1, line2, plane1, plane2, planePlaneView, linePlaneView, lineLineView } = stateRef.current;

    if (mode === "lineForms") {
      addInfiniteLine(group, line1, colors.entity1);
      addDraggablePoint(group, line1.point, colors.entity1, 0.13, "line1", "point");
      addDraggableArrow(group, line1.point, line1.direction, colors.entity1, 1.6, "line1", "direction");
    } else if (mode === "planeForms") {
      addPlane(group, plane1, colors.entity1);
      addDraggablePoint(group, plane1.point, colors.entity1, 0.13, "plane1", "point");
      addDraggableArrow(group, plane1.point, plane1.normal, colors.entity1, 2, "plane1", "normal");
    } else if (mode === "linePlane") {
      addPlane(group, plane1, colors.entity2, 0.22);
      addDraggablePoint(group, plane1.point, colors.entity2, 0.11, "plane1", "point");
      addDraggableArrow(group, plane1.point, plane1.normal, colors.entity2, 1.8, "plane1", "normal");

      addInfiniteLine(group, line1, colors.entity1);
      addDraggablePoint(group, line1.point, colors.entity1, 0.13, "line1", "point");
      addDraggableArrow(group, line1.point, line1.direction, colors.entity1, 1.6, "line1", "direction");

      if (linePlaneView === "reflection") {
        const reflected = reflectLineAcrossPlane(line1, plane1);
        addInfiniteLine(group, reflected, colors.result, 1, false);
        addPoint(group, reflected.point, colors.result, 0.13);
        addArrow(group, reflected.point, reflected.direction, colors.result, 1.6);
      } else {
        const rel = linePlaneRelationship(line1, plane1);
        if (rel.type === "intersecting") {
          addPoint(group, rel.point, colors.result, 0.16);
          // angle between the line and its own shadow on the plane
          const shadow = perpendicularComponent(line1.direction, plane1.normal);
          addAngleArc(group, toThree(rel.point), toThree(line1.direction), toThree(shadow), rel.angleDeg, colors.result);
        }
      }
    } else if (mode === "lineLine") {
      addInfiniteLine(group, line1, colors.entity1);
      addDraggablePoint(group, line1.point, colors.entity1, 0.13, "line1", "point");
      addDraggableArrow(group, line1.point, line1.direction, colors.entity1, 1.6, "line1", "direction");

      addInfiniteLine(group, line2, colors.entity2);
      addDraggablePoint(group, line2.point, colors.entity2, 0.13, "line2", "point");
      addDraggableArrow(group, line2.point, line2.direction, colors.entity2, 1.6, "line2", "direction");

      if (lineLineView === "addition") {
        const anchor = line1.point;
        const sum = add(line1.direction, line2.direction);
        const sumMag = magnitude(sum);
        if (sumMag > 1e-6) {
          addArrow(group, anchor, sum, colors.result, sumMag);
          const tip1 = add(anchor, line1.direction);
          const tip2 = add(anchor, line2.direction);
          const sumPoint = add(anchor, sum);
          addSegment(group, tip1, sumPoint, colors.entity2);
          addSegment(group, tip2, sumPoint, colors.entity1);
        }
      } else if (lineLineView === "cross") {
        const anchor = line1.point;
        addParallelogram(group, anchor, line1.direction, line2.direction, colors.result);
        const cross = crossProduct(line1.direction, line2.direction);
        addArrow(group, anchor, cross, colors.accent, 1.8);
      } else {
        const rel = lineLineRelationship(line1, line2);
        // arcs use the acute-side direction for line2, matching angleDeg's
        // acos(|dot|/...) — flip d2 when the raw dot product is negative.
        const d2Acute = dot(line1.direction, line2.direction) >= 0
          ? line2.direction
          : { x: -line2.direction.x, y: -line2.direction.y, z: -(line2.direction.z || 0) };

        if (rel.type === "intersecting") {
          addPoint(group, rel.point, colors.result, 0.16);
          addAngleArc(group, toThree(rel.point), toThree(line1.direction), toThree(d2Acute), rel.angleDeg, colors.result);
        } else if (rel.type === "skew") {
          const closest = closestPointsOnSkewLines(line1, line2);
          if (closest) {
            const { P1, P2 } = closest;
            addPoint(group, P1, colors.result, 0.1);
            addPoint(group, P2, colors.result, 0.1);
            addSegment(group, P1, P2, colors.result);
            const midpoint = toThree(P1).lerp(toThree(P2), 0.5);
            addAngleArc(group, midpoint, toThree(line1.direction), toThree(d2Acute), rel.angleDeg, colors.result);
          }
        }
      }
    } else if (mode === "planePlane") {
      addPlane(group, plane1, colors.entity1);
      addDraggablePoint(group, plane1.point, colors.entity1, 0.11, "plane1", "point");
      addDraggableArrow(group, plane1.point, plane1.normal, colors.entity1, 1.8, "plane1", "normal");

      addPlane(group, plane2, colors.entity2);
      addDraggablePoint(group, plane2.point, colors.entity2, 0.11, "plane2", "point");
      addDraggableArrow(group, plane2.point, plane2.normal, colors.entity2, 1.8, "plane2", "normal");

      const rel = planePlaneRelationship(plane1, plane2);

      if (planePlaneView === "reflection") {
        const reflected = reflectPlaneAcrossPlane(plane2, plane1);
        addPlane(group, reflected, colors.result, 0.28);
        addPoint(group, reflected.point, colors.result, 0.11);
        addArrow(group, reflected.point, reflected.normal, colors.result, 1.8);
      } else if (planePlaneView === "angle") {
        if (rel.type === "intersecting") {
          addInfiniteLine(group, rel.line, colors.result, 1, false);
          const n2Acute = dot(plane1.normal, plane2.normal) >= 0
            ? plane2.normal
            : { x: -plane2.normal.x, y: -plane2.normal.y, z: -(plane2.normal.z || 0) };
          addAngleArc(group, toThree(rel.line.point), toThree(plane1.normal), toThree(n2Acute), rel.angleDeg, colors.result);
        }
        // parallel/same: angle is 0, nothing extra to draw
      } else if (planePlaneView === "distance") {
        if (rel.type === "parallel" || rel.type === "same") {
          // perpendicular segment from plane1's point to plane2
          const n = plane2.normal;
          const nMagSq = n.x * n.x + n.y * n.y + (n.z || 0) * (n.z || 0);
          const diff = subtract(plane1.point, plane2.point);
          const t = (diff.x * n.x + diff.y * n.y + (diff.z || 0) * (n.z || 0)) / nMagSq;
          const foot = {
            x: plane1.point.x - t * n.x,
            y: plane1.point.y - t * n.y,
            z: (plane1.point.z || 0) - t * (n.z || 0),
          };
          addPoint(group, foot, colors.result, 0.1);
          addSegment(group, plane1.point, foot, colors.result);
        }
        // intersecting: distance is 0 — nothing meaningful to draw
      }
    }
  });

  return <div className="scene3d" ref={containerRef} />;
}
