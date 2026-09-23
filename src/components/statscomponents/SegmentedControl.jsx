// Row of mutually-exclusive toggle buttons (tail direction, axis, restriction
// type, ...) shared across the Statistics topics.
export default function SegmentedControl({ label, value, onChange, options }) {
  return (
    <div className="segmented-field">
      {label && <span className="slider-field-label">{label}</span>}
      <div className="segmented-control" role="radiogroup" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`segmented-option ${value === opt.value ? "is-active" : ""}`}
            role="radio"
            aria-checked={value === opt.value}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
