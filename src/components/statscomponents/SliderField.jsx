// Labelled slider + numeric readout, shared across the Statistics topics.
// Mirrors the visual language of vectorcomponents/NumberLineInput but pairs
// it with a label and a live value badge (most stats controls need both).
export default function SliderField({ label, value, onChange, min, max, step = 1, unit = "", color, format }) {
  const display = format ? format(value) : value;
  return (
    <div className="slider-field">
      <div className="slider-field-head">
        <span className="slider-field-label">{label}</span>
        <span className="slider-field-value">
          {display}
          {unit}
        </span>
      </div>
      <input
        type="range"
        className="slider-field-range"
        style={{ "--sf-color": color }}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={label}
      />
    </div>
  );
}
