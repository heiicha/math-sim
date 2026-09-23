import SegmentedControl from "../statscomponents/SegmentedControl";
import SliderField from "../statscomponents/SliderField";
import { nPr, factorial, multinomial } from "../../utils/statsMath";
import { letterFrequency, slotValues } from "./permMath";

export const DEFAULT_PERMUTATIONS_STATE = { subMode: "distinct", n: 5, r: 3, word: "PARAGRAPH" };

const SUB_MODE_OPTIONS = [
  { value: "distinct", label: "Distinct objects" },
  { value: "repetition", label: "Repetition allowed" },
  { value: "identical", label: "Some identical" },
];

export function PermutationsControls({ state, setState }) {
  const { subMode, n, r, word } = state;

  return (
    <>
      <SegmentedControl label="Case" value={subMode} onChange={(subMode) => setState({ ...state, subMode })} options={SUB_MODE_OPTIONS} />

      {subMode !== "identical" ? (
        <div className="control-group">
          <SliderField
            label="n — distinct objects available"
            value={n}
            min={1}
            max={12}
            step={1}
            onChange={(n) => setState({ ...state, n, r: subMode === "distinct" ? Math.min(r, n) : r })}
          />
          <SliderField
            label="r — objects arranged in the row"
            value={r}
            min={0}
            max={subMode === "distinct" ? n : 8}
            step={1}
            onChange={(r) => setState({ ...state, r })}
          />
        </div>
      ) : (
        <div className="control-group">
          <div className="stat-field">
            <span className="stat-field-label">Word to arrange</span>
            <input
              type="text"
              className="stat-input"
              value={word}
              maxLength={12}
              onChange={(e) => setState({ ...state, word: e.target.value.toUpperCase() })}
              aria-label="Word to arrange"
            />
          </div>
        </div>
      )}
    </>
  );
}

export function PermutationsVisual({ state }) {
  const { subMode, n, r, word } = state;

  if (subMode === "identical") {
    const { letters, counts } = letterFrequency(word);
    return (
      <div className="perm-visual">
        <div className="letter-freq-table">
          {letters.length === 0 && <p className="counting-visual-caption">Type a word to see its letter frequencies.</p>}
          {letters.map((l) => (
            <div className="letter-freq-cell" key={l}>
              <span className="letter-freq-letter">{l}</span>
              <span className="letter-freq-count">{counts.get(l)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const slots = slotValues(n, r, subMode === "repetition");
  return (
    <div className="perm-visual">
      <div className="slot-row">
        {slots.length === 0 && <p className="counting-visual-caption">Set r above 0 to fill some slots.</p>}
        {slots.map((value, i) => (
          <div className="slot-box" key={i}>
            {value}
          </div>
        ))}
      </div>
      {slots.length > 0 && (
        <p className="counting-visual-caption">
          {subMode === "distinct"
            ? "Each slot has one fewer choice than the last — earlier picks are no longer available."
            : "Every slot has all n symbols available again — repetition means nothing is used up."}
        </p>
      )}
    </div>
  );
}

export function PermutationsReadout({ state }) {
  const { subMode, n, r, word } = state;

  if (subMode === "identical") {
    const { letters, counts, total } = letterFrequency(word);
    const groupSizes = letters.map((l) => counts.get(l));
    const ways = letters.length ? multinomial(total, groupSizes) : 0;
    const denomStr = letters.map((l) => `${counts.get(l)}!`).join("");
    return (
      <>
        <p className="readout-def">
          Suppose there are n objects, of which there are k different groups of identical objects. The total number of
          permutations of all n objects in a row is n! / (n₁!n₂!...nₖ!), where nᵢ is the number of identical objects in the
          i-th group — the division compensates for over-counting under the assumption that objects within each group are
          distinct. (§2.3)
        </p>
        <p className="formula">
          {total}! / ({denomStr || "—"}) = {ways.toLocaleString()}
        </p>
        <div className="result-row is-highlighted">
          <span>Number of arrangements of “{word || "—"}”</span>
          <strong>{ways.toLocaleString()}</strong>
        </div>
      </>
    );
  }

  if (subMode === "repetition") {
    const ways = Math.pow(n, r);
    return (
      <>
        <p className="readout-def">
          When repetition of the n distinct objects is allowed, every one of the r slots can independently be filled by any
          of the n objects — by the multiplication principle, the total number of ways is nʳ. (cf. Example 2.2.3(ii))
        </p>
        <p className="formula">
          {n}^{r} = {ways.toLocaleString()}
        </p>
        <div className="result-row is-highlighted">
          <span>Total arrangements</span>
          <strong>{ways.toLocaleString()}</strong>
        </div>
      </>
    );
  }

  const ways = nPr(n, r);
  return (
    <>
      <p className="readout-def">
        Given n distinct objects, the number of ways of arranging r of these objects (1 ≤ r ≤ n) in a row is n(n−1)(n−2)⋯(n−r+1)
        = n!/(n−r)! = ⁿPᵣ. (§2.1–2.2)
      </p>
      <p className="formula">
        {n}P{r} = {n}! / ({n}−{r})! = {ways.toLocaleString()}
      </p>
      <div className="result-row is-highlighted">
        <span>Total arrangements</span>
        <strong>{ways.toLocaleString()}</strong>
      </div>
      <p className="condition">
        <span className="condition-label">Remarks</span>
        ⁿP₀ = 1 by convention (there is exactly one way to arrange nothing), and when r = n, ⁿPₙ = n!/0! = n! = {factorial(n).toLocaleString()}.
      </p>
    </>
  );
}
