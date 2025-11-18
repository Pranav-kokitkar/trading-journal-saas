
import { useState, useMemo, useContext } from "react";
import styles from "./TradeHistory.module.css";
import { useTrades } from "../../../store/TradeContext"; 
import { TradeCard } from "./TradeCard";

export const TradeHistory = () => {
  // get trades from TradeContext (single source of truth)
  const { trades: contextTrades = [] } = useTrades() || {};

  // fallback for legacy/local dev: read from localStorage if context empty
  const savedFromLocal = JSON.parse(localStorage.getItem("trades") || "[]");
  const trades =
    Array.isArray(contextTrades) && contextTrades.length > 0
      ? contextTrades
      : savedFromLocal;

  const [filters, setFilters] = useState({
    symbol: "",
    marketType: "",
    status: "",
    result: "",
    direction: "",
    pnlOperator: ">",
    pnlValue: "",
    rrOperator: ">",
    rrValue: "",
    startDate: "",
    endDate: "",
    startTradeNumber: "",
    endTradeNumber: "",
  });

  const handleClearFilters = () =>
    setFilters({
      symbol: "",
      marketType: "",
      status: "",
      result: "",
      direction: "",
      pnlOperator: ">",
      pnlValue: "",
      rrOperator: ">",
      rrValue: "",
      startDate: "",
      endDate: "",
      startTradeNumber: "",
      endTradeNumber: "",
    });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // compute filtered trades from the `trades` variable
  const filteredTrades = useMemo(() => {
    return (trades || []).filter((t) => {
      // symbol search (partial, case-insensitive)
      if (filters.symbol) {
        const search = filters.symbol.toLowerCase();
        if (!t.symbol?.toLowerCase().includes(search)) return false;
      }

      if (filters.marketType && t.marketType !== filters.marketType)
        return false;
      if (filters.status && (t.tradeStatus || t.status) !== filters.status)
        return false;
      if (filters.result && (t.tradeResult || t.result) !== filters.result)
        return false;
      if (
        filters.direction &&
        (t.tradedirection || t.tradeDirection) !== filters.direction
      )
        return false;

      // PnL
      if (filters.pnlValue) {
        const val = Number(filters.pnlValue);
        const tPnl = Number(t.pnl || 0);
        if (filters.pnlOperator === ">" && !(tPnl > val)) return false;
        if (filters.pnlOperator === "<" && !(tPnl < val)) return false;
        if (filters.pnlOperator === "=" && !(tPnl === val)) return false;
      }

      // RR
      if (filters.rrValue) {
        const val = Number(filters.rrValue);
        const tRr = Number(t.rr || 0);
        if (filters.rrOperator === ">" && !(tRr > val)) return false;
        if (filters.rrOperator === "<" && !(tRr < val)) return false;
        if (filters.rrOperator === "=" && !(tRr === val)) return false;
      }

      // Date range: support both dateTime and dateNtime
      if (filters.startDate || filters.endDate) {
        const raw = t.dateTime ?? t.dateNtime ?? t.date ?? null;
        if (!raw) return false;
        const tradeDate = new Date(raw);
        if (filters.startDate && tradeDate < new Date(filters.startDate))
          return false;
        // add one day to endDate to include trades on that day (optional)
        if (filters.endDate && tradeDate > new Date(filters.endDate))
          return false;
      }

      // Trade number range
      if (
        filters.startTradeNumber &&
        Number(t.tradeNumber) < Number(filters.startTradeNumber)
      )
        return false;
      if (
        filters.endTradeNumber &&
        Number(t.tradeNumber) > Number(filters.endTradeNumber)
      )
        return false;

      return true;
    });
  }, [filters, trades]);

  return (
    <section id="trade-history" className={styles.tardehistory}>
      <div className={styles.tradehistorycontainer}>
        <div className={styles.heading}>
          <h3>Trade History</h3>
          <p>Review and analyze all your trades here</p>
        </div>

        <div className={styles.filter}>
          <h3>Advanced Filter & Search</h3>

          <div className={styles.filterinput}>
            <input
              type="text"
              name="symbol"
              placeholder="Search symbol..."
              value={filters.symbol}
              onChange={handleFilterChange}
            />

            <select
              name="marketType"
              value={filters.marketType}
              onChange={handleFilterChange}
            >
              <option value="">All Market</option>
              <option value="forex">Forex</option>
              <option value="crypto">Crypto</option>
              <option value="stocks">Stocks</option>
            </select>

            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Status</option>
              <option value="live">Live</option>
              <option value="exited">Exited</option>
            </select>

            <select
              name="result"
              value={filters.result}
              onChange={handleFilterChange}
            >
              <option value="">All Result</option>
              <option value="win">Win</option>
              <option value="loss">Loss</option>
            </select>

            <select
              name="direction"
              value={filters.direction}
              onChange={handleFilterChange}
            >
              <option value="">All Direction</option>
              <option value="long">Long</option>
              <option value="short">Short</option>
            </select>
          </div>

          <div className={styles.filterinput}>
            <div className={styles.filterinputsec}>
              <label>PnL:</label>
              <select
                name="pnlOperator"
                value={filters.pnlOperator}
                onChange={handleFilterChange}
              >
                <option value=">">&gt;</option>
                <option value="<">&lt;</option>
                <option value="=">=</option>
              </select>
              <input
                type="number"
                name="pnlValue"
                placeholder="PnL"
                value={filters.pnlValue}
                onChange={handleFilterChange}
              />
            </div>

            <div className={styles.filterinputsec}>
              <label>RR:</label>
              <select
                name="rrOperator"
                value={filters.rrOperator}
                onChange={handleFilterChange}
              >
                <option value=">">&gt;</option>
                <option value="<">&lt;</option>
                <option value="=">=</option>
              </select>
              <input
                type="number"
                name="rrValue"
                placeholder="RR"
                value={filters.rrValue}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          <div className={styles.filterinput}>
            <div className={styles.filterinputsec}>
              <label>Date:</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>

            <div className={styles.filterinputsec}>
              <label>Trade:</label>
              <input
                type="number"
                name="startTradeNumber"
                placeholder="From"
                value={filters.startTradeNumber}
                onChange={handleFilterChange}
              />
              <input
                type="number"
                name="endTradeNumber"
                placeholder="To"
                value={filters.endTradeNumber}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          <div className={styles.filter3}>
            <p>
              Showing {filteredTrades.length} of {trades.length} trades
            </p>
            <button type="button" onClick={handleClearFilters}>
              Clear Filters
            </button>
          </div>
        </div>

        <TradeCard savedTrade={filteredTrades} />
      </div>
    </section>
  );
};


