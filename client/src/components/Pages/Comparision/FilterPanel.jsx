// src/components/FilterPanel.jsx
import React, { useState } from "react";
import "./FilterPanel.css";

const FilterPanel = ({ onFilter }) => {
  const [symbol, setSymbol] = useState("");
  const [direction, setDirection] = useState("all");
  const [pnlOperator, setPnlOperator] = useState(">");
  const [pnlValue, setPnlValue] = useState("");
  const [rrOperator, setRrOperator] = useState(">");
  const [rrValue, setRrValue] = useState("");

  const handleApply = () => {
    onFilter({
      symbol,
      direction,
      pnlOperator,
      pnlValue: Number(pnlValue),
      rrOperator,
      rrValue: Number(rrValue),
    });
  };

  return (
    <div className="filter-panel">
      <div>
        <label>Symbol:</label>
        <input
          type="text"
          placeholder="EURUSD, GBPUSD"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        />
      </div>

      <div>
        <label>Direction:</label>
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
        >
          <option value="all">All</option>
          <option value="long">Long</option>
          <option value="short">Short</option>
        </select>
      </div>

      <div>
        <label>PnL:</label>
        <select
          value={pnlOperator}
          onChange={(e) => setPnlOperator(e.target.value)}
        >
          <option value=">">&gt;</option>
          <option value="<">&lt;</option>
          <option value="=">=</option>
        </select>
        <input
          type="number"
          value={pnlValue}
          onChange={(e) => setPnlValue(e.target.value)}
        />
      </div>

      <div>
        <label>RR:</label>
        <select
          value={rrOperator}
          onChange={(e) => setRrOperator(e.target.value)}
        >
          <option value=">">&gt;</option>
          <option value="<">&lt;</option>
          <option value="=">=</option>
        </select>
        <input
          type="number"
          value={rrValue}
          onChange={(e) => setRrValue(e.target.value)}
        />
      </div>

      <button onClick={handleApply}>Apply Filter</button>
    </div>
  );
};

export default FilterPanel;
