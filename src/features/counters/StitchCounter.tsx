import React from "react";

export default function StitchCounter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ marginTop: 8 }}>
      <h4>Stitches</h4>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={() => onChange(Math.max(0, value - 1))}>-</button>
        <div style={{ minWidth: 80, textAlign: "center" }}>{value}</div>
        <button onClick={() => onChange(value + 1)}>+</button>
        <button onClick={() => onChange(0)}>Reset</button>
      </div>
    </div>
  );
}
