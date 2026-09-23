import SliderField from "../statscomponents/SliderField";
import { nCr, nPr, factorial } from "../../utils/statsMath";

export const DEFAULT_COMBINATIONS_STATE = { n: 6, r: 2 };

export function CombinationsControls({ state, setState }) {
  const { n, r } = state;
  return (
    <div className="control-group">
      <SliderField label="n — distinct objects" value={n} min={1} max={10} step={1} onChange={(n) => setState({ n, r: Math.min(r, n) })} />
      <SliderField label="r — objects selected" value={r} min={0} max={n} step={1} onChange={(r) => setState({ n, r })} />
    </div>
  );
}

export function CombinationsVisual({ state }) {
  const { n, r } = state;
  const rows = [];
  for (let i = 0; i <= n; i++) {
    const row = [];
    for (let k = 0; k <= i; k++) row.push(nCr(i, k));
    rows.push(row);
  }

  return (
    <div className="pascal-triangle">
      {rows.map((row, i) => (
        <div className="pascal-row" key={i}>
          {row.map((value, k) => (
            <div className={`pascal-cell ${i === n && k === r ? "is-highlighted" : ""}`} key={k}>
              {value}
            </div>
          ))}
        </div>
      ))}
      <p className="counting-visual-caption">
        Row n of Pascal's triangle lists ⁿC₀, ⁿC₁, ..., ⁿCₙ — the highlighted cell is ⁿCᵣ.
      </p>
    </div>
  );
}

export function CombinationsReadout({ state }) {
  const { n, r } = state;
  const combos = nCr(n, r);
  const perms = nPr(n, r);
  const rFact = factorial(r);

  return (
    <>
      <p className="readout-def">
        The number of ways to select r objects from n distinct objects, where the order of selection does not matter, is
        denoted ⁿCᵣ (or (ⁿᵣ)), where ⁿCᵣ = n!/(r!(n−r)!) for r ≤ n. (§3.1)
      </p>
      <p className="formula">
        {n}C{r} = {n}! / ({r}!({n}−{r})!) = {combos.toLocaleString()}
      </p>
      <div className="result-row is-highlighted">
        <span>Number of selections</span>
        <strong>{combos.toLocaleString()}</strong>
      </div>
      <div className="result-row">
        <span>
          ⁿPᵣ = ⁿCᵣ × r! (select, then arrange)
        </span>
        <strong>
          {combos.toLocaleString()} × {rFact.toLocaleString()} = {perms.toLocaleString()}
        </strong>
      </div>
      <p className="condition">
        <span className="condition-label">Special results (§3.1)</span>
        ⁿC₀ = ⁿCₙ = 1 (one way to take none, or take all); ⁿC₁ = n; and ⁿCᵣ = ⁿC₍ₙ₋ᵣ₎, since choosing r objects to take is
        equivalent to choosing (n−r) objects to leave behind.
      </p>
    </>
  );
}
