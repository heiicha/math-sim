import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  linePlaneRelationship,
  lineLineRelationship,
  planePlaneRelationship,
  reflectPointAcrossPlane,
  spanningVectors,
  subtract,
} from "./geometry3D.js";
import { magnitude } from "../vectorcomponents/vectorMath.js";
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

export default function Scene3D({ mode, line1, line2, plane1, plane2, planePlaneView, reflectPoint }) {
  const containerRef = useRef(null);
  const stateRef = useRef({ mode, line1, line2, plane1, plane2, planePlaneView, reflectPoint });
  stateRef.current = { mode, line1, line2, plane1, plane2, planePlaneView, reflectPoint };

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
    const { mode, line1, line2, plane1, plane2, planePlaneView, reflectPoint } = stateRef.current;

    if (mode === "lineForms") {
      addInfiniteLine(group, line1, colors.entity1);
      addPoint(group, line1.point, colors.entity1, 0.13);
      addArrow(group, line1.point, line1.direction, colors.entity1);
    } else if (mode === "planeForms") {
      addPlane(group, plane1, colors.entity1);
      addPoint(group, plane1.point, colors.entity1, 0.13);
      addArrow(group, plane1.point, plane1.normal, colors.entity1, 2);
    } else if (mode === "linePlane") {
      addPlane(group, plane1, colors.entity2, 0.22);
      addPoint(group, plane1.point, colors.entity2, 0.11);
      addArrow(group, plane1.point, plane1.normal, colors.entity2, 1.8);

      addInfiniteLine(group, line1, colors.entity1);
      addPoint(group, line1.point, colors.entity1, 0.13);
      addArrow(group, line1.point, line1.direction, colors.entity1);

      const rel = linePlaneRelationship(line1, plane1);
      if (rel.type === "intersecting") {
        addPoint(group, rel.point, colors.result, 0.16);
      }
    } else if (mode === "lineLine") {
      addInfiniteLine(group, line1, colors.entity1);
      addPoint(group, line1.point, colors.entity1, 0.13);
      addArrow(group, line1.point, line1.direction, colors.entity1);

      addInfiniteLine(group, line2, colors.entity2);
      addPoint(group, line2.point, colors.entity2, 0.13);
      addArrow(group, line2.point, line2.direction, colors.entity2);

      const rel = lineLineRelationship(line1, line2);
      if (rel.type === "intersecting") {
        addPoint(group, rel.point, colors.result, 0.16);
      } else if (rel.type === "skew") {
        // shortest connecting segment between the two lines
        const d1 = line1.direction;
        const d2 = line2.direction;
        const w0 = subtract(line1.point, line2.point);
        const a = magnitude(d1) ** 2;
        const b = d1.x * d2.x + d1.y * d2.y + (d1.z || 0) * (d2.z || 0);
        const c = magnitude(d2) ** 2;
        const dVal = d1.x * w0.x + d1.y * w0.y + (d1.z || 0) * (w0.z || 0);
        const e = d2.x * w0.x + d2.y * w0.y + (d2.z || 0) * (w0.z || 0);
        const denom = a * c - b * b;
        if (Math.abs(denom) > 1e-9) {
          const s = (b * e - c * dVal) / denom;
          const t = (a * e - b * dVal) / denom;
          const P1 = {
            x: line1.point.x + s * d1.x,
            y: line1.point.y + s * d1.y,
            z: (line1.point.z || 0) + s * (d1.z || 0),
          };
          const P2 = {
            x: line2.point.x + t * d2.x,
            y: line2.point.y + t * d2.y,
            z: (line2.point.z || 0) + t * (d2.z || 0),
          };
          addPoint(group, P1, colors.result, 0.1);
          addPoint(group, P2, colors.result, 0.1);
          addSegment(group, P1, P2, colors.result);
        }
      }
    } else if (mode === "planePlane") {
      addPlane(group, plane1, colors.entity1);
      addPoint(group, plane1.point, colors.entity1, 0.11);
      addArrow(group, plane1.point, plane1.normal, colors.entity1, 1.8);

      addPlane(group, plane2, colors.entity2);
      addPoint(group, plane2.point, colors.entity2, 0.11);
      addArrow(group, plane2.point, plane2.normal, colors.entity2, 1.8);

      const rel = planePlaneRelationship(plane1, plane2);

      if (planePlaneView === "reflection") {
        addPoint(group, reflectPoint, colors.dim, 0.1);
        const reflected = reflectPointAcrossPlane(reflectPoint, plane1);
        addPoint(group, reflected, colors.result, 0.13);
        addSegment(group, reflectPoint, reflected, colors.result);
      } else if (rel.type === "intersecting") {
        addInfiniteLine(group, rel.line, colors.result, 1, false);
      } else if ((rel.type === "parallel" || rel.type === "same") && planePlaneView === "distance") {
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
    }
  });

  return <div className="scene3d" ref={containerRef} />;
}
