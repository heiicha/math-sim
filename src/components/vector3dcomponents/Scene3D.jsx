import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  linePlaneRelationship,
  lineLineRelationship,
  planePlaneRelationship,
  reflectLineAcrossPlane,
  reflectPlaneAcrossPlane,
  reflectPointAcrossPlane,
  reflectPointAcrossLine,
  footOfPerpendicularToLine,
  footOfPerpendicularToPlane,
  spanningVectors,
  subtract,
  closestPointsOnSkewLines,
} from "./geometry3D.js";
import { magnitude, dot, perpendicularComponent, crossProduct, add } from "../vectorcomponents/vectorMath.js";
import "./Scene3D.css";

const LINE_REACH = 7; // how far each drawn line extends past its defining point
const PLANE_SIZE = 7; // side length of the finite plane patch we draw
const LINE_MARGIN = 1.5; // extra length drawn past a target point (e.g. an intersection)
const PLANE_MARGIN = 1.2; // extra half-size drawn past a target point's in-plane projection

function readColors() {
  const style = getComputedStyle(document.documentElement);
  const get = (name) => style.getPropertyValue(name).trim();
  return {
    entity1: get("--vec-a") || "#e4b980",
    entity2: get("--vec-b") || "#6990e4",
    entity3: get("--vec-c") || "#5fae6b",
    entity4: get("--vec-d") || "#e0a23d",
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
  // Sprite.geometry is a module-level singleton shared by every THREE.Sprite
  // in the app (see three's Sprite.js) — disposing it here would tear down
  // that shared buffer on every rebuild instead of anything owned by `obj`.
  if (!obj.isSprite) obj.geometry?.dispose();
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

function addInfiniteLine(group, line, colorHex, opacity = 1, dashed = false, reach = LINE_REACH) {
  const p = toThree(line.point);
  const d = toThree(line.direction).normalize();
  const a = p.clone().addScaledVector(d, -reach);
  const b = p.clone().addScaledVector(d, reach);
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

// A hollow-ring texture, built once and reused (tinted per-marker via
// SpriteMaterial.color) — cheaper than drawing a fresh canvas per handle,
// which matters since the whole scene rebuilds on every drag frame.
let handleRingTexture = null;
function getHandleRingTexture() {
  if (handleRingTexture) return handleRingTexture;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const cx = size / 2;
  const cy = size / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.44, 0, Math.PI * 2);
  ctx.arc(cx, cy, size * 0.32, 0, Math.PI * 2, true);
  ctx.fillStyle = "#ffffff";
  ctx.fill("evenodd");
  handleRingTexture = new THREE.CanvasTexture(canvas);
  return handleRingTexture;
}

const HANDLE_MARKER_SCALE = 0.5;
const HANDLE_MARKER_HOVER_SCALE = 0.72;

// Always-visible ring, billboarded to face the camera, that sits on every
// draggable point/arrow-tip so students can see at a glance what's
// grabbable — separate from the invisible raycast sphere above, which only
// exists to make the hit-target bigger than the tiny visible geometry.
function addHandleMarker(group, position, colorHex) {
  const material = new THREE.SpriteMaterial({
    map: getHandleRingTexture(),
    color: colorHex,
    transparent: true,
    opacity: 0.9,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(HANDLE_MARKER_SCALE, HANDLE_MARKER_SCALE, 1);
  sprite.userData.baseScale = HANDLE_MARKER_SCALE;
  sprite.renderOrder = 1;
  group.add(sprite);
  return sprite;
}

function addDraggablePoint(group, point, colorHex, radius, entity, field) {
  addPoint(group, point, colorHex, radius);
  const marker = addHandleMarker(group, toThree(point), colorHex);
  const handle = addHandle(group, toThree(point), "point", entity, field);
  handle.userData.marker = marker;
}

function addDraggableArrow(group, origin, direction, colorHex, length, entity, field) {
  addArrow(group, origin, direction, colorHex, length);
  const dir = toThree(direction);
  if (dir.length() < 1e-6) return;
  dir.normalize();
  const tip = toThree(origin).addScaledVector(dir, length);
  const marker = addHandleMarker(group, tip, colorHex);
  const handle = addHandle(group, tip, "direction", entity, field, { origin });
  handle.userData.marker = marker;
}

function addPlane(group, plane, colorHex, opacity = 0.28, half = PLANE_SIZE / 2) {
  const { m1: b, m2: c } = spanningVectors(plane.normal);
  const p = toThree(plane.point);
  const bT = toThree(b);
  const cT = toThree(c);

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

// How far a drawn line needs to reach (symmetrically, in both directions)
// so it still covers every point in `targets` — e.g. a computed
// intersection — with a bit of margin, instead of always stopping at the
// same fixed length regardless of where that point actually falls.
function lineReachFor(line, targets) {
  let reach = LINE_REACH;
  if (!targets.length) return reach;
  const d = toThree(line.direction);
  if (d.lengthSq() < 1e-9) return reach;
  d.normalize();
  const p = toThree(line.point);
  for (const target of targets) {
    const t = toThree(target).sub(p).dot(d);
    reach = Math.max(reach, Math.abs(t) + LINE_MARGIN);
  }
  return reach;
}

// How large a drawn plane patch's half-size needs to be, in the plane's own
// (b, c) basis, so it still contains every point in `targets`.
function planeHalfFor(plane, targets) {
  let half = PLANE_SIZE / 2;
  if (!targets.length) return half;
  const { m1: b, m2: c } = spanningVectors(plane.normal);
  const bT = toThree(b);
  const cT = toThree(c);
  const p = toThree(plane.point);
  for (const target of targets) {
    const rel = toThree(target).sub(p);
    half = Math.max(half, Math.abs(rel.dot(bT)) + PLANE_MARGIN, Math.abs(rel.dot(cT)) + PLANE_MARGIN);
  }
  return half;
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

// Small billboarded text label (e.g. "x") — built fresh per call since the
// text/color differ per axis, but buildAxes only runs once per mount (it's
// part of the static, never-rebuilt group), so this isn't a per-frame cost.
function createTextSprite(text, colorHex) {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.font = "bold 40px sans-serif";
  ctx.fillStyle = colorHex;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, size / 2, size / 2);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.6, 0.6, 1);
  return sprite;
}

function buildAxes(group, colors) {
  const axisLen = 8;
  const specs = [
    { dir: new THREE.Vector3(1, 0, 0), color: 0xb8b8b8, label: "x" }, // math x
    { dir: new THREE.Vector3(0, 1, 0), color: 0xb8b8b8, label: "z" }, // math z (up)
    { dir: new THREE.Vector3(0, 0, 1), color: 0xb8b8b8, label: "y" }, // math y
  ];
  specs.forEach(({ dir, color, label }) => {
    const a = dir.clone().multiplyScalar(-axisLen);
    const b = dir.clone().multiplyScalar(axisLen);
    const geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 });
    group.add(new THREE.Line(geometry, material));

    const labelSprite = createTextSprite(label, colors.dim);
    labelSprite.position.copy(b).addScaledVector(dir, 0.6);
    group.add(labelSprite);
  });
}

export default function Scene3D({
  mode,
  line1,
  setLine1,
  line2,
  setLine2,
  line3,
  setLine3,
  line4,
  setLine4,
  plane1,
  setPlane1,
  plane2,
  setPlane2,
  plane3,
  setPlane3,
  plane4,
  setPlane4,
  lpLine1,
  setLpLine1,
  lpLine2,
  setLpLine2,
  lpPlane1,
  setLpPlane1,
  lpPlane2,
  setLpPlane2,
  point1,
  setPoint1,
  planePlaneView,
  linePlaneView,
  lineLineView,
  pointLineView,
  pointPlaneView,
}) {
  const containerRef = useRef(null);
  const state = {
    mode,
    line1,
    setLine1,
    line2,
    setLine2,
    line3,
    setLine3,
    line4,
    setLine4,
    plane1,
    setPlane1,
    plane2,
    setPlane2,
    plane3,
    setPlane3,
    plane4,
    setPlane4,
    lpLine1,
    setLpLine1,
    lpLine2,
    setLpLine2,
    lpPlane1,
    setLpPlane1,
    lpPlane2,
    setLpPlane2,
    point1,
    setPoint1,
    planePlaneView,
    linePlaneView,
    lineLineView,
    pointLineView,
    pointPlaneView,
  };
  const stateRef = useRef(state);
  stateRef.current = state;

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
    buildAxes(staticGroup, colors);
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
      if (entity === "point1") {
        s.setPoint1(snap(threeToMath(worldHit)));
        return;
      }
      const setters = {
        line1: s.setLine1,
        line2: s.setLine2,
        line3: s.setLine3,
        line4: s.setLine4,
        plane1: s.setPlane1,
        plane2: s.setPlane2,
        plane3: s.setPlane3,
        plane4: s.setPlane4,
        lpLine1: s.setLpLine1,
        lpLine2: s.setLpLine2,
        lpPlane1: s.setLpPlane1,
        lpPlane2: s.setLpPlane2,
      };
      const current = {
        line1: s.line1,
        line2: s.line2,
        line3: s.line3,
        line4: s.line4,
        plane1: s.plane1,
        plane2: s.plane2,
        plane3: s.plane3,
        plane4: s.plane4,
        lpLine1: s.lpLine1,
        lpLine2: s.lpLine2,
        lpPlane1: s.lpPlane1,
        lpPlane2: s.lpPlane2,
      };
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

    // Enlarges a handle's visible ring on hover, as a second (motion) cue on
    // top of the cursor change — reset before switching to whatever's newly
    // hovered (or nothing). `handle` may reference a mesh from a since-disposed
    // rebuild; mutating a detached object's scale is harmless, it just no
    // longer renders.
    let hoveredHandle = null;
    function setHoveredHandle(handle) {
      if (hoveredHandle === handle) return;
      const prevMarker = hoveredHandle?.userData?.marker;
      if (prevMarker) prevMarker.scale.setScalar(prevMarker.userData.baseScale);
      hoveredHandle = handle;
      const nextMarker = hoveredHandle?.userData?.marker;
      if (nextMarker) nextMarker.scale.setScalar(HANDLE_MARKER_HOVER_SCALE);
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
      renderer.domElement.style.cursor = "grabbing";
    }
    function onPointerMove(evt) {
      if (dragTarget) {
        toNDC(evt);
        raycaster.setFromCamera(ndc, camera);
        if (raycaster.ray.intersectPlane(dragPlane, hitPoint)) applyDrag(dragTarget, hitPoint);
        return;
      }
      const hit = pickHandle(evt);
      setHoveredHandle(hit);
      renderer.domElement.style.cursor = hit ? "grab" : "auto";
    }
    function onPointerUp(evt) {
      if (dragTarget) renderer.domElement.releasePointerCapture(evt.pointerId);
      dragTarget = null;
      controls.enabled = true;
      renderer.domElement.style.cursor = hoveredHandle ? "grab" : "auto";
    }
    function onPointerLeave() {
      setHoveredHandle(null);
      if (!dragTarget) renderer.domElement.style.cursor = "auto";
    }
    // capture:true so this runs before OrbitControls' own bubble-phase
    // pointerdown listener on the same element — otherwise orbiting would
    // already have started by the time we disable controls.
    renderer.domElement.addEventListener("pointerdown", onPointerDown, { capture: true });
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);
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
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
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
    const {
      mode,
      line1,
      line2,
      line3,
      line4,
      plane1,
      plane2,
      plane3,
      plane4,
      lpLine1,
      lpLine2,
      lpPlane1,
      lpPlane2,
      point1,
      planePlaneView,
      linePlaneView,
      lineLineView,
      pointLineView,
      pointPlaneView,
    } = stateRef.current;

    if (mode === "lineForms") {
      addInfiniteLine(group, line1, colors.entity1);
      addDraggablePoint(group, line1.point, colors.entity1, 0.13, "line1", "point");
      addDraggableArrow(group, line1.point, line1.direction, colors.entity1, 1.6, "line1", "direction");
    } else if (mode === "planeForms") {
      addPlane(group, plane1, colors.entity1);
      addDraggablePoint(group, plane1.point, colors.entity1, 0.13, "plane1", "point");
      addDraggableArrow(group, plane1.point, plane1.normal, colors.entity1, 2, "plane1", "normal");
    } else if (mode === "linePlane") {
      // line1/plane1 are always present; lpLine1/lpLine2/lpPlane1/lpPlane2
      // are a shared pool of up to 2 extras (each either a line or a
      // plane) — color follows the same fixed priority ControlPanel3D uses.
      const lineEntries = [{ key: "line1", data: line1, color: colors.entity1 }];
      const planeEntries = [{ key: "plane1", data: plane1, color: colors.entity2 }];
      const lpSlots = [
        { key: "lpLine1", type: "line", data: lpLine1 },
        { key: "lpLine2", type: "line", data: lpLine2 },
        { key: "lpPlane1", type: "plane", data: lpPlane1 },
        { key: "lpPlane2", type: "plane", data: lpPlane2 },
      ].filter((s) => s.data);
      lpSlots.forEach((slot, i) => {
        const color = i === 0 ? colors.entity3 : colors.entity4;
        if (slot.type === "line") lineEntries.push({ key: slot.key, data: slot.data, color });
        else planeEntries.push({ key: slot.key, data: slot.data, color });
      });

      const isRelationshipView = linePlaneView !== "reflection";
      const pairs = [];
      if (isRelationshipView) {
        lineEntries.forEach((l) => {
          planeEntries.forEach((pl) => {
            pairs.push({ line: l, plane: pl, rel: linePlaneRelationship(l.data, pl.data) });
          });
        });
      }
      const hitsForLine = (entry) =>
        pairs.filter((pr) => pr.line === entry && pr.rel.type === "intersecting").map((pr) => pr.rel.point);
      const hitsForPlane = (entry) =>
        pairs.filter((pr) => pr.plane === entry && pr.rel.type === "intersecting").map((pr) => pr.rel.point);

      planeEntries.forEach((entry) => {
        addPlane(group, entry.data, entry.color, 0.22, planeHalfFor(entry.data, hitsForPlane(entry)));
        addDraggablePoint(group, entry.data.point, entry.color, 0.11, entry.key, "point");
        addDraggableArrow(group, entry.data.point, entry.data.normal, entry.color, 1.8, entry.key, "normal");
      });
      lineEntries.forEach((entry) => {
        addInfiniteLine(group, entry.data, entry.color, 1, false, lineReachFor(entry.data, hitsForLine(entry)));
        addDraggablePoint(group, entry.data.point, entry.color, 0.13, entry.key, "point");
        addDraggableArrow(group, entry.data.point, entry.data.direction, entry.color, 1.6, entry.key, "direction");
      });

      if (linePlaneView === "reflection") {
        // reflect every line present across the base plane (plane1)
        const mirror = planeEntries[0].data;
        lineEntries.forEach((entry) => {
          const reflected = reflectLineAcrossPlane(entry.data, mirror);
          addInfiniteLine(group, reflected, colors.result, 1, false);
          addPoint(group, reflected.point, colors.result, 0.13);
          addArrow(group, reflected.point, reflected.direction, colors.result, 1.6);
        });
      } else {
        pairs.forEach((pr) => {
          if (pr.rel.type !== "intersecting") return;
          addPoint(group, pr.rel.point, colors.result, 0.16);
          // angle between the line and its own shadow on the plane
          const shadow = perpendicularComponent(pr.line.data.direction, pr.plane.data.normal);
          addAngleArc(group, toThree(pr.rel.point), toThree(pr.line.data.direction), toThree(shadow), pr.rel.angleDeg, colors.result);
        });
      }
    } else if (mode === "lineLine") {
      const lineEntries = [
        { key: "line1", data: line1, color: colors.entity1 },
        { key: "line2", data: line2, color: colors.entity2 },
        ...(line3 ? [{ key: "line3", data: line3, color: colors.entity3 }] : []),
        ...(line4 ? [{ key: "line4", data: line4, color: colors.entity4 }] : []),
      ];
      const isRelationshipView = lineLineView !== "addition" && lineLineView !== "cross";

      // Every pair's relationship, computed once — reused both to size each
      // line's drawn reach (so it visibly meets whatever it intersects, or
      // reaches its closest point on a skew partner) and for the
      // relationship-view overlays themselves.
      const pairs = [];
      if (isRelationshipView) {
        for (let i = 0; i < lineEntries.length; i++) {
          for (let j = i + 1; j < lineEntries.length; j++) {
            const a = lineEntries[i];
            const b = lineEntries[j];
            const rel = lineLineRelationship(a.data, b.data);
            const closest = rel.type === "skew" ? closestPointsOnSkewLines(a.data, b.data) : null;
            pairs.push({ a, b, rel, closest });
          }
        }
      }
      const hitsFor = (entry) => {
        const hits = [];
        pairs.forEach((pr) => {
          if (pr.a !== entry && pr.b !== entry) return;
          if (pr.rel.type === "intersecting") hits.push(pr.rel.point);
          else if (pr.rel.type === "skew" && pr.closest) hits.push(pr.a === entry ? pr.closest.P1 : pr.closest.P2);
        });
        return hits;
      };

      lineEntries.forEach((entry) => {
        addInfiniteLine(group, entry.data, entry.color, 1, false, lineReachFor(entry.data, hitsFor(entry)));
        addDraggablePoint(group, entry.data.point, entry.color, 0.13, entry.key, "point");
        addDraggableArrow(group, entry.data.point, entry.data.direction, entry.color, 1.6, entry.key, "direction");
      });

      if (lineLineView === "addition") {
        const anchor = lineEntries[0].data.point;
        const dirs = lineEntries.map((e) => e.data.direction);
        const sum = dirs.reduce((acc, d) => add(acc, d), { x: 0, y: 0, z: 0 });
        const sumMag = magnitude(sum);
        if (sumMag > 1e-6) {
          addArrow(group, anchor, sum, colors.result, sumMag);
          if (lineEntries.length === 2) {
            // default (exactly 2 lines): keep the original parallelogram-
            // style completion, one segment per direction
            const tip1 = add(anchor, dirs[0]);
            const tip2 = add(anchor, dirs[1]);
            const sumPoint = add(anchor, sum);
            addSegment(group, tip1, sumPoint, lineEntries[1].color);
            addSegment(group, tip2, sumPoint, lineEntries[0].color);
          } else {
            // 3+ lines: a simple tip-to-tail chain
            let elbow = add(anchor, dirs[0]);
            for (let i = 1; i < dirs.length; i++) {
              const next = add(elbow, dirs[i]);
              addSegment(group, elbow, next, lineEntries[i].color);
              elbow = next;
            }
          }
        }
      } else if (lineLineView === "cross") {
        // cross product is strictly binary — always line1 x line2, extra
        // lines don't participate
        const anchor = lineEntries[0].data.point;
        addParallelogram(group, anchor, lineEntries[0].data.direction, lineEntries[1].data.direction, colors.result);
        const cross = crossProduct(lineEntries[0].data.direction, lineEntries[1].data.direction);
        addArrow(group, anchor, cross, colors.result, 1.6);
      } else {
        pairs.forEach((pr) => {
          // arcs use the acute-side direction for b, matching angleDeg's
          // acos(|dot|/...) — flip it when the raw dot product is negative.
          const bDir = pr.b.data.direction;
          const dAcute = dot(pr.a.data.direction, bDir) >= 0
            ? bDir
            : { x: -bDir.x, y: -bDir.y, z: -(bDir.z || 0) };

          if (pr.rel.type === "intersecting") {
            addPoint(group, pr.rel.point, colors.result, 0.16);
            addAngleArc(group, toThree(pr.rel.point), toThree(pr.a.data.direction), toThree(dAcute), pr.rel.angleDeg, colors.result);
          } else if (pr.rel.type === "skew" && pr.closest) {
            const { P1, P2 } = pr.closest;
            addPoint(group, P1, colors.result, 0.1);
            addPoint(group, P2, colors.result, 0.1);
            addSegment(group, P1, P2, colors.result);
            const midpoint = toThree(P1).lerp(toThree(P2), 0.5);
            addAngleArc(group, midpoint, toThree(pr.a.data.direction), toThree(dAcute), pr.rel.angleDeg, colors.result);
          }
        });
      }
    } else if (mode === "planePlane") {
      const planeEntries = [
        { key: "plane1", data: plane1, color: colors.entity1 },
        { key: "plane2", data: plane2, color: colors.entity2 },
        ...(plane3 ? [{ key: "plane3", data: plane3, color: colors.entity3 }] : []),
        ...(plane4 ? [{ key: "plane4", data: plane4, color: colors.entity4 }] : []),
      ];

      const pairs = [];
      if (planePlaneView === "angle" || planePlaneView === "distance") {
        for (let i = 0; i < planeEntries.length; i++) {
          for (let j = i + 1; j < planeEntries.length; j++) {
            pairs.push({ a: planeEntries[i], b: planeEntries[j], rel: planePlaneRelationship(planeEntries[i].data, planeEntries[j].data) });
          }
        }
      }

      // For the angle view, size each plane patch around the point on its
      // intersection line (with every other plane it meets) closest to its
      // own defining point, so the patches visibly meet along that line
      // instead of it passing outside their fixed-size quads.
      const footOnLine = (line, point) => {
        const p = toThree(line.point);
        const d = toThree(line.direction).normalize();
        const t = toThree(point).sub(p).dot(d);
        const footThree = p.clone().addScaledVector(d, t);
        return { x: footThree.x, y: footThree.z, z: footThree.y };
      };
      const hitsFor = (entry) => {
        if (planePlaneView !== "angle") return [];
        return pairs
          .filter((pr) => pr.rel.type === "intersecting" && (pr.a === entry || pr.b === entry))
          .map((pr) => footOnLine(pr.rel.line, entry.data.point));
      };

      planeEntries.forEach((entry) => {
        addPlane(group, entry.data, entry.color, 0.28, planeHalfFor(entry.data, hitsFor(entry)));
        addDraggablePoint(group, entry.data.point, entry.color, 0.11, entry.key, "point");
        addDraggableArrow(group, entry.data.point, entry.data.normal, entry.color, 1.8, entry.key, "normal");
      });

      if (planePlaneView === "reflection") {
        // reflect every other plane across the base plane (plane1)
        planeEntries.slice(1).forEach((entry) => {
          const reflected = reflectPlaneAcrossPlane(entry.data, planeEntries[0].data);
          addPlane(group, reflected, colors.result, 0.28);
          addPoint(group, reflected.point, colors.result, 0.11);
          addArrow(group, reflected.point, reflected.normal, colors.result, 1.8);
        });
      } else if (planePlaneView === "angle") {
        pairs.forEach((pr) => {
          if (pr.rel.type !== "intersecting") return;
          const lineHits = [footOnLine(pr.rel.line, pr.a.data.point), footOnLine(pr.rel.line, pr.b.data.point)];
          addInfiniteLine(group, pr.rel.line, colors.result, 1, false, lineReachFor(pr.rel.line, lineHits));
          const bNormal = pr.b.data.normal;
          const nAcute = dot(pr.a.data.normal, bNormal) >= 0
            ? bNormal
            : { x: -bNormal.x, y: -bNormal.y, z: -(bNormal.z || 0) };
          addAngleArc(group, toThree(pr.rel.line.point), toThree(pr.a.data.normal), toThree(nAcute), pr.rel.angleDeg, colors.result);
        });
        // parallel/same pairs: angle is 0, nothing extra to draw
      } else if (planePlaneView === "distance") {
        pairs.forEach((pr) => {
          if (pr.rel.type !== "parallel" && pr.rel.type !== "same") return;
          // perpendicular segment from a's point to plane b
          const n = pr.b.data.normal;
          const nMagSq = n.x * n.x + n.y * n.y + (n.z || 0) * (n.z || 0);
          const diff = subtract(pr.a.data.point, pr.b.data.point);
          const t = (diff.x * n.x + diff.y * n.y + (diff.z || 0) * (n.z || 0)) / nMagSq;
          const foot = {
            x: pr.a.data.point.x - t * n.x,
            y: pr.a.data.point.y - t * n.y,
            z: (pr.a.data.point.z || 0) - t * (n.z || 0),
          };
          addPoint(group, foot, colors.result, 0.1);
          addSegment(group, pr.a.data.point, foot, colors.result);
        });
        // intersecting pairs: distance is 0 — nothing meaningful to draw
      }
    } else if (mode === "pointLine") {
      addInfiniteLine(group, line1, colors.entity2, 1, false, lineReachFor(line1, [point1]));
      addDraggablePoint(group, line1.point, colors.entity2, 0.13, "line1", "point");
      addDraggableArrow(group, line1.point, line1.direction, colors.entity2, 1.6, "line1", "direction");

      addDraggablePoint(group, point1, colors.entity1, 0.13, "point1", "position");

      const foot = footOfPerpendicularToLine(point1, line1);
      if (foot) {
        addPoint(group, foot, colors.result, 0.1);
        addSegment(group, point1, foot, colors.result);

        if (pointLineView === "reflection") {
          const reflected = reflectPointAcrossLine(point1, line1);
          addPoint(group, reflected, colors.result, 0.13);
          addSegment(group, foot, reflected, colors.result);
        }
      }
    } else if (mode === "pointPlane") {
      const hits = [point1];
      addPlane(group, plane1, colors.entity2, 0.22, planeHalfFor(plane1, hits));
      addDraggablePoint(group, plane1.point, colors.entity2, 0.11, "plane1", "point");
      addDraggableArrow(group, plane1.point, plane1.normal, colors.entity2, 1.8, "plane1", "normal");

      addDraggablePoint(group, point1, colors.entity1, 0.13, "point1", "position");

      const foot = footOfPerpendicularToPlane(point1, plane1);
      if (foot) {
        addPoint(group, foot, colors.result, 0.1);
        addSegment(group, point1, foot, colors.result);

        if (pointPlaneView === "reflection") {
          const reflected = reflectPointAcrossPlane(point1, plane1);
          addPoint(group, reflected, colors.result, 0.13);
          addSegment(group, foot, reflected, colors.result);
        }
      }
    }
  });

  return <div className="scene3d" ref={containerRef} />;
}
