export function magnitude(v) {
  const z = v.z || 0;
  return Math.sqrt(v.x * v.x + v.y * v.y + z * z);
}

export function dot(a, b) {
  return a.x * b.x + a.y * b.y + (a.z || 0) * (b.z || 0);
}

export function crossProduct(a, b) {
  const az = a.z || 0;
  const bz = b.z || 0;
  return {
    x: a.y * bz - az * b.y,
    y: az * b.x - a.x * bz,
    z: a.x * b.y - a.y * b.x,
  };
}

export function cross2D(a, b) {
  return a.x * b.y - a.y * b.x;
}

export function angleBetween(a, b) {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  const cosTheta = Math.min(1, Math.max(-1, dot(a, b) / (magA * magB)));
  return Math.acos(cosTheta);
}

export function scalarProjection(a, b) {
  const magB = magnitude(b);
  if (magB === 0) return 0;
  return dot(a, b) / magB;
}

export function vectorProjection(a, b) {
  const magBSq = dot(b, b);
  if (magBSq === 0) return { x: 0, y: 0, z: 0 };
  const scale = dot(a, b) / magBSq;
  return { x: b.x * scale, y: b.y * scale, z: (b.z || 0) * scale };
}

export function perpendicularComponent(a, b) {
  const proj = vectorProjection(a, b);
  return {
    x: a.x - proj.x,
    y: a.y - proj.y,
    z: (a.z || 0) - proj.z,
  };
}

export function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y, z: (a.z || 0) + (b.z || 0) };
}

export function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

export function sectionFormula(A, B, m, n) {
  const total = m + n;
  if (total === 0) return { x: A.x, y: A.y, z: A.z || 0 };
  return {
    x: (n * A.x + m * B.x) / total,
    y: (n * A.y + m * B.y) / total,
    z: (n * (A.z || 0) + m * (B.z || 0)) / total,
  };
}

export function toIJK(v, digits = 2) {
  const parts = [
    { value: v.x, letter: "i" },
    { value: v.y, letter: "j" },
    { value: v.z || 0, letter: "k" },
  ];
  let out = "";
  parts.forEach((p, idx) => {
    const abs = Math.abs(p.value).toFixed(digits);
    if (idx === 0) {
      out += `${p.value < 0 ? "-" : ""}${abs}${p.letter}`;
    } else {
      out += p.value < 0 ? ` - ${abs}${p.letter}` : ` + ${abs}${p.letter}`;
    }
  });
  return out;
}
