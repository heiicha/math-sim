import { useEffect, useState } from "react";

// A plain controlled <input type="number"> fights the user: after every
// change event React resyncs the DOM value to match the rendered prop, so
// if onChange only forwards values that parse to a finite number, clearing
// the field (or typing "-" / "1." on the way to a real number) gets stomped
// back to the last valid digit before the keystroke even registers. Track
// the raw text locally so the field always shows exactly what was typed,
// and only forward parsed numbers upstream once they're valid.
export default function NumberField({ value, onChange, ...props }) {
  const [text, setText] = useState(String(value));

  // Re-sync from the outside (e.g. a reset, or another control changing
  // this value) without clobbering an in-progress, still-valid edit.
  useEffect(() => {
    setText((prev) => (parseFloat(prev) === value ? prev : String(value)));
  }, [value]);

  return (
    <input
      type="number"
      {...props}
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        const parsed = parseFloat(raw);
        if (Number.isFinite(parsed)) onChange(parsed);
      }}
    />
  );
}
