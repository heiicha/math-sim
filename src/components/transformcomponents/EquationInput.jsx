export default function EquationInput({ value, onChange, error, label = "y = f(x) =" }) {
  return (
    <div className="equation-input-group">
      <label className="equation-label" htmlFor="fx-input">
        {label}
      </label>
      <input
        id="fx-input"
        type="text"
        className={`equation-field ${error ? "has-error" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        placeholder="e.g. x^2 - 3x + 2"
      />
      {error && <p className="equation-error">{error}</p>}
      <p className="equation-hint">
        Use x as the variable. Supports +, −, ×, ÷, ^, sin/cos/tan, sqrt, abs, ln, log, exp, and π, e.
      </p>
    </div>
  );
}
