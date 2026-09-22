// A small hand-rolled recursive-descent parser/compiler for single-variable
// real functions f(x). No eval()/Function() — user input is tokenized and
// walked into an AST, then compiled into nested closures.

const FUNCTIONS = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  arcsin: Math.asin,
  acos: Math.acos,
  arccos: Math.acos,
  atan: Math.atan,
  arctan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  sqrt: Math.sqrt,
  abs: Math.abs,
  exp: Math.exp,
  ln: Math.log,
  log: Math.log10,
  log10: Math.log10,
  log2: Math.log2,
};

const CONSTANTS = {
  pi: Math.PI,
  e: Math.E,
};

function tokenize(input) {
  const tokens = [];
  let i = 0;
  while (i < input.length) {
    const c = input[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      let dotSeen = false;
      while (j < input.length && /[0-9.]/.test(input[j])) {
        if (input[j] === ".") {
          if (dotSeen) throw new Error(`Malformed number near "${input.slice(i, j + 1)}"`);
          dotSeen = true;
        }
        j++;
      }
      const numStr = input.slice(i, j);
      if (numStr === "." || numStr === "") throw new Error(`Malformed number near "${numStr}"`);
      tokens.push({ type: "number", value: parseFloat(numStr) });
      i = j;
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      let j = i;
      while (j < input.length && /[a-zA-Z]/.test(input[j])) j++;
      tokens.push({ type: "ident", value: input.slice(i, j) });
      i = j;
      continue;
    }
    if ("+-*/^()".includes(c)) {
      tokens.push({ type: c });
      i++;
      continue;
    }
    throw new Error(`Unexpected character "${c}"`);
  }
  return tokens;
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }
  peek() {
    return this.tokens[this.pos];
  }
  next() {
    return this.tokens[this.pos++];
  }
  atEnd() {
    return this.pos >= this.tokens.length;
  }
  expect(type) {
    const t = this.next();
    if (!t || t.type !== type) throw new Error(`Expected "${type}"${t ? `, got "${t.type}"` : ""}`);
    return t;
  }
  startsPrimary(t) {
    return !!t && (t.type === "number" || t.type === "ident" || t.type === "(");
  }

  parseExpression() {
    return this.parseAddSub();
  }

  parseAddSub() {
    let node = this.parseMulDiv();
    while (!this.atEnd() && (this.peek().type === "+" || this.peek().type === "-")) {
      const op = this.next().type;
      const right = this.parseMulDiv();
      node = { type: "binary", op, left: node, right };
    }
    return node;
  }

  parseMulDiv() {
    let node = this.parseUnary();
    while (!this.atEnd()) {
      const t = this.peek();
      if (t.type === "*" || t.type === "/") {
        this.next();
        const right = this.parseUnary();
        node = { type: "binary", op: t.type, left: node, right };
      } else if (this.startsPrimary(t)) {
        // implicit multiplication: "2x", "3sin(x)", "(x+1)(x-1)", "2(x+1)"
        const right = this.parseUnary();
        node = { type: "binary", op: "*", left: node, right };
      } else {
        break;
      }
    }
    return node;
  }

  parseUnary() {
    if (!this.atEnd() && (this.peek().type === "-" || this.peek().type === "+")) {
      const op = this.next().type;
      const operand = this.parseUnary();
      return op === "-" ? { type: "neg", operand } : operand;
    }
    return this.parsePow();
  }

  parsePow() {
    const base = this.parsePrimary();
    if (!this.atEnd() && this.peek().type === "^") {
      this.next();
      const exponent = this.parseUnary(); // right-assoc, exponent may itself be unary (x^-2)
      return { type: "binary", op: "^", left: base, right: exponent };
    }
    return base;
  }

  parsePrimary() {
    const t = this.peek();
    if (!t) throw new Error("Unexpected end of equation");
    if (t.type === "number") {
      this.next();
      return { type: "number", value: t.value };
    }
    if (t.type === "(") {
      this.next();
      const node = this.parseExpression();
      this.expect(")");
      return node;
    }
    if (t.type === "ident") {
      this.next();
      const name = t.value.toLowerCase();
      if (!this.atEnd() && this.peek().type === "(" && FUNCTIONS[name]) {
        this.next();
        const arg = this.parseExpression();
        this.expect(")");
        return { type: "call", name, arg };
      }
      if (name === "x") return { type: "var" };
      if (name in CONSTANTS) return { type: "const", name };
      if (FUNCTIONS[name]) throw new Error(`"${name}" needs parentheses, e.g. ${name}(x)`);
      throw new Error(`Unknown name "${t.value}" — use x, a number, or a known function (sin, cos, tan, sqrt, ln, log, exp, abs, ...)`);
    }
    throw new Error(`Unexpected "${t.type}"`);
  }
}

function compile(node) {
  switch (node.type) {
    case "number": {
      const v = node.value;
      return () => v;
    }
    case "var":
      return (x) => x;
    case "const": {
      const v = CONSTANTS[node.name];
      return () => v;
    }
    case "neg": {
      const f = compile(node.operand);
      return (x) => -f(x);
    }
    case "call": {
      const fn = FUNCTIONS[node.name];
      const arg = compile(node.arg);
      return (x) => fn(arg(x));
    }
    case "binary": {
      const l = compile(node.left);
      const r = compile(node.right);
      if (node.op === "+") return (x) => l(x) + r(x);
      if (node.op === "-") return (x) => l(x) - r(x);
      if (node.op === "*") return (x) => l(x) * r(x);
      if (node.op === "/") return (x) => l(x) / r(x);
      if (node.op === "^") return (x) => Math.pow(l(x), r(x));
      break;
    }
    default:
      break;
  }
  throw new Error("Invalid equation");
}

// Parses "x^2 - 3x + 2", "sin(x)", "1/x", "sqrt(x)", "e^x", ... into a JS
// function of one variable. Throws a short, student-readable Error on bad
// input; never uses eval()/Function() on the input string.
export function parseFunction(input) {
  const trimmed = (input || "").trim();
  if (!trimmed) throw new Error("Enter an equation, e.g. x^2 or sin(x)");
  const tokens = tokenize(trimmed);
  if (tokens.length === 0) throw new Error("Enter an equation, e.g. x^2 or sin(x)");
  const parser = new Parser(tokens);
  const ast = parser.parseExpression();
  if (!parser.atEnd()) {
    const t = parser.peek();
    throw new Error(`Unexpected "${t.type === "ident" ? t.value : t.type}" — check for a missing operator or bracket`);
  }
  return compile(ast);
}
