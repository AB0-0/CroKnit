export default function StitchCounter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="counter" role="group" aria-label="Stitch counter">
      <h4>Stitches</h4>
      <div className="counter-controls">
        <button className="btn-ctrl" aria-label="Decrease stitches" onClick={() => onChange(Math.max(0, value - 1))}>-</button>
        <div className="counter-value" aria-live="polite">{value}</div>
        <button className="btn-ctrl" aria-label="Increase stitches" onClick={() => onChange(value + 1)}>+</button>
        <button className="btn-ctrl reset" aria-label="Reset stitches" onClick={() => onChange(0)}>Reset</button>
      </div>
    </div>
  );
}
