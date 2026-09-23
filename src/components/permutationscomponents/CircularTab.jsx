import SegmentedControl from "../statscomponents/SegmentedControl";
import SliderField from "../statscomponents/SliderField";
import { factorial, circularPermutations } from "../../utils/statsMath";
import { circlePoints, PERSON_LABELS } from "./permMath";

export const DEFAULT_CIRCULAR_STATE = { n: 5, seatsNumbered: false };

export function CircularControls({ state, setState }) {
  const { n, seatsNumbered } = state;
  return (
    <>
      <div className="control-group">
        <SliderField label="n — distinct objects" value={n} min={3} max={10} step={1} onChange={(n) => setState({ ...state, n })} />
      </div>
      <SegmentedControl
        label="Are the seats numbered?"
        value={seatsNumbered ? "yes" : "no"}
        onChange={(v) => setState({ ...state, seatsNumbered: v === "yes" })}
        options={[
          { value: "no", label: "Not numbered (true circle)" },
          { value: "yes", label: "Numbered (row in disguise)" },
        ]}
      />
    </>
  );
}

export function CircularVisual({ state }) {
  const { n, seatsNumbered } = state;
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 34;
  const points = circlePoints(n, cx, cy, radius);

  return (
    <div className="circular-visual">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={`${n} objects arranged in a circle`}>
        {points.map((p, i) => {
          const next = points[(i + 1) % points.length];
          return <line key={`edge-${i}`} x1={p.x} y1={p.y} x2={next.x} y2={next.y} className="circular-edge" />;
        })}
        {points.map((p, i) => (
          <g key={`node-${i}`}>
            <circle cx={p.x} cy={p.y} r={18} className="circular-node" />
            <text x={p.x} y={p.y + 5} textAnchor="middle" className="circular-node-label">
              {PERSON_LABELS[i] || i + 1}
            </text>
            {seatsNumbered && (
              <text x={p.x} y={p.y - 26} textAnchor="middle" className="circular-seat-label">
                seat {i + 1}
              </text>
            )}
          </g>
        ))}
        <path
          d={`M ${cx + radius + 22} ${cy} A ${radius + 22} ${radius + 22} 0 0 1 ${cx} ${cy - radius - 22}`}
          className="circular-direction-arrow"
          markerEnd="url(#circular-arrowhead)"
        />
        <defs>
          <marker id="circular-arrowhead" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" className="circular-arrowhead-fill" />
          </marker>
        </defs>
      </svg>
      <p className="counting-visual-caption">
        {seatsNumbered
          ? "With the seats numbered, each seat is a distinct position — clockwise and anticlockwise relabellings all count separately, so this is really a row problem."
          : "With the seats unnumbered, arrangements that are just rotations of each other (like sliding everyone one seat clockwise) are the same arrangement."}
      </p>
    </div>
  );
}

export function CircularReadout({ state }) {
  const { n, seatsNumbered } = state;
  const ways = seatsNumbered ? factorial(n) : circularPermutations(n);
  return (
    <>
      <p className="readout-def">
        The number of permutations of n distinct objects in a circle, where the seats are indistinguishable, is n!/n =
        (n−1)!. Clockwise and anticlockwise circular arrangements are different. Unless stated otherwise, seats are assumed
        not numbered when a circular arrangement is involved. (§2.4)
      </p>
      <p className="formula">
        {seatsNumbered ? `${n}! = ${ways.toLocaleString()}` : `(${n}−1)! = ${Math.max(n - 1, 0)}! = ${ways.toLocaleString()}`}
      </p>
      <div className="result-row is-highlighted">
        <span>Circular arrangements</span>
        <strong>{ways.toLocaleString()}</strong>
      </div>
      <p className="condition">
        <span className="condition-label">Why divide by n?</span>
        Every one of the n! row arrangements of these objects corresponds to n different "rotations" of the same circular
        arrangement (rotating who sits "first"), so the row count over-counts by a factor of n.
      </p>
    </>
  );
}
