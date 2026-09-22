// Every translation/scaling/reflection step from the notes (§1) boils down
// to one of six variable replacements applied to the *current* equation
// y = g(x). Because every one of those replacements is affine in x and/or
// y, an arbitrarily long chain of them always collapses to
//
//   y = A * f(B*x + C) + D
//
// so instead of re-deriving/simplifying algebra per step, we just track
// (A, B, C, D) and fold each step into it. This also gives us the resultant
// equation string and a numeric evaluator "for free".

export const IDENTITY = { A: 1, B: 1, C: 0, D: 0 };

export function applyStep(state, step) {
  const { A, B, C, D } = state;
  if (step.type === "translate") {
    const signed = step.direction === "positive" ? step.units : -step.units;
    if (step.axis === "x") {
      // replace x with x - signed  =>  g(x) becomes g(x - signed)
      return { A, B, C: C - B * signed, D };
    }
    // replace y with y - signed  =>  y - signed = g(x)  =>  y = g(x) + signed
    return { A, B, C, D: D + signed };
  }
  if (step.type === "scale") {
    const s = step.factor > 0 ? step.factor : 1;
    if (step.axis === "x") {
      // geometric scale factor s parallel to x-axis  =>  g(x) becomes g(x/s)
      return { A, B: B / s, C, D };
    }
    // geometric scale factor s parallel to y-axis  =>  y = s * g(x)
    return { A: A * s, B, C, D: D * s };
  }
  if (step.type === "reflect") {
    if (step.axis === "x") {
      // reflect in x-axis: replace y with -y  =>  y = -g(x)
      return { A: -A, B, C, D: -D };
    }
    // reflect in y-axis: replace x with -x  =>  y = g(-x)
    return { A, B: -B, C: -C, D };
  }
  return state;
}

export function composeSteps(steps) {
  return steps.reduce((state, step) => applyStep(state, step), IDENTITY);
}

export function buildEvaluator(baseFn, { A, B, C, D }) {
  return (x) => A * baseFn(B * x + C) + D;
}

export function fmtNum(n, digits = 4) {
  if (Object.is(n, -0)) n = 0;
  const factor = 10 ** digits;
  const rounded = Math.round(n * factor) / factor;
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded);
}

// y = A f(Bx + C) + D, simplified for display (drop implicit 1s, 0s, etc.)
export function formatComposite({ A, B, C, D }, fname = "f") {
  let inner;
  if (B === 1) inner = "x";
  else if (B === -1) inner = "-x";
  else inner = `${fmtNum(B)}x`;

  if (C !== 0) inner += C > 0 ? ` + ${fmtNum(C)}` : ` - ${fmtNum(Math.abs(C))}`;

  const fexpr = `${fname}(${inner})`;

  let outer;
  if (A === 1) outer = fexpr;
  else if (A === -1) outer = `-${fexpr}`;
  else outer = `${fmtNum(A)}${fexpr}`;

  if (D !== 0) outer += D > 0 ? ` + ${fmtNum(D)}` : ` - ${fmtNum(Math.abs(D))}`;

  return `y = ${outer}`;
}

export function describeStep(step, subjectLabel = "y = f(x)") {
  if (step.type === "translate") {
    const dir = step.direction === "positive" ? "positive" : "negative";
    return `Translate the graph of ${subjectLabel} in the ${dir} ${step.axis}-direction by ${fmtNum(step.units)} units.`;
  }
  if (step.type === "scale") {
    const axisName = step.axis === "x" ? "x-axis" : "y-axis";
    return `Scale the graph of ${subjectLabel} parallel to the ${axisName} by a factor of ${fmtNum(step.factor)}.`;
  }
  if (step.type === "reflect") {
    const axisName = step.axis === "x" ? "x-axis" : "y-axis";
    return `Reflect the graph of ${subjectLabel} in the ${axisName}.`;
  }
  return "";
}

// Mirrors the notes' "Note:" boxes — the algebraic variable substitution
// that underlies each geometric description.
export function variableReplacement(step) {
  if (step.type === "translate") {
    const signed = step.direction === "positive" ? step.units : -step.units;
    const sign = signed >= 0 ? "−" : "+";
    const mag = fmtNum(Math.abs(signed));
    return step.axis === "x" ? `Replace x with x ${sign} ${mag}` : `Replace y with y ${sign} ${mag}`;
  }
  if (step.type === "scale") {
    const s = fmtNum(step.factor);
    return step.axis === "x" ? `Replace x with x/${s}` : `Replace y with y/${s}`;
  }
  if (step.type === "reflect") {
    return step.axis === "x" ? "Replace y with −y" : "Replace x with −x";
  }
  return "";
}

export const DEFAULT_STEPS = {
  translate: { type: "translate", axis: "y", direction: "positive", units: 2 },
  scale: { type: "scale", axis: "y", factor: 0.5 },
  reflect: { type: "reflect", axis: "x" },
};

// Quoted (near-)verbatim from the notes, §1.
export const DEFINITIONS = {
  translate:
    "A translation in ℝ² is a geometrical transformation that moves every point of an object in ℝ² by the same distance in the same direction. (Definition 1.2)",
  scale:
    "A scaling in ℝ² is a geometrical transformation that increases or decreases the distance of every point on an object from a fixed line (called an invariant line) by a constant multiple (called a scale factor). (Definition 1.3)",
  reflect:
    "A reflection in ℝ² is a geometrical transformation that maps every point on an object to its mirror image in a given fixed line (or axis). (Definition 1.4)",
};

export const RESULT_TEXT = {
  translate: {
    y: "If a is a positive constant: y = f(x) + a is a translation of y = f(x) in the positive y-direction by a units; y = f(x) − a is a translation of y = f(x) in the negative y-direction by a units. (Result 1.5)",
    x: "If a is a positive constant: y = f(x − a) is a translation of y = f(x) in the positive x-direction by a units; y = f(x + a) is a translation of y = f(x) in the negative x-direction by a units. (Result 1.6)",
  },
  scale: {
    y: "If a is a positive constant, y = af(x) is a scaling of y = f(x) parallel to the y-axis by a factor of a. (Result 1.7)",
    x: "If a is a positive constant, y = f(ax) is a scaling of y = f(x) parallel to the x-axis by a factor of 1/a. (Result 1.8)",
  },
  reflect: {
    x: "y = −f(x) is a reflection of y = f(x) in the x-axis. (Result 1.9)",
    y: "y = f(−x) is a reflection of y = f(x) in the y-axis. (Result 1.10)",
  },
};
