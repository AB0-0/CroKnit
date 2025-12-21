export default function RowCounter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="counter" role="group" aria-label="Row counter">
      <h4>Rows</h4>
      <div className="counter-controls">
        <button className="btn-ctrl" aria-label="Decrease rows" onClick={() => onChange(Math.max(0, value - 1))}>-</button>
        <div className="counter-value" aria-live="polite">{value}</div>
        <button className="btn-ctrl" aria-label="Increase rows" onClick={() => onChange(value + 1)}>+</button>
        <button className="btn-ctrl reset" aria-label="Reset rows" onClick={() => onChange(0)}>Reset</button>
      </div>
    </div>
  );
}
