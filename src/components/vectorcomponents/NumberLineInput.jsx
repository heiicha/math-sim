import "./NumberLineInput.css";

// A plain draggable bar for setting a single component, alongside the
// numeric input. The visible range always widens to keep the current value
// comfortably inside it, so the thumb never gets stuck at an end without
// reflecting the real value.
export default function NumberLineInput({ value, onChange, min = -8, max = 8, step = 0.5, color }) {
  const lo = Math.min(min, Math.floor(value) - 2);
  const hi = Math.max(max, Math.ceil(value) + 2);

  return (
    <input
      type="range"
      className="number-line-range"
      style={{ "--nl-color": color }}
      min={lo}
      max={hi}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      aria-label="drag to set value"
    />
  );
}
