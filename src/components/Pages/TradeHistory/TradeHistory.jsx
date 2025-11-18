import { NavLink } from "react-router-dom";
import { useState, useMemo } from "react";
import styles from "./TradeHistory.module.css";

export const TradeHistory = () => {
  const [tardes, setTrades] = useState("");
  const savedTrade = JSON.parse(localStorage.getItem("trades") || "[]");

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

  const handleClearFilters = () => {
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
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Filter trades dynamically
  const filteredTrades = useMemo(() => {
    return savedTrade.filter((t) => {
      // Symbol search (partial match, case-insensitive)
      if (filters.symbol) {
        const search = filters.symbol.toLowerCase();
        if (!t.symbol?.toLowerCase().includes(search)) return false;
      }

      if (filters.marketType && t.marketType !== filters.marketType)
        return false;
      if (filters.status && t.tradeStatus !== filters.status) return false;
      if (filters.result && t.tradeResult !== filters.result) return false;
      if (filters.direction && t.tradedirection !== filters.direction)
        return false;

      // PnL filter
      if (filters.pnlValue) {
        const val = Number(filters.pnlValue);
        if (filters.pnlOperator === ">" && !(t.pnl > val)) return false;
        if (filters.pnlOperator === "<" && !(t.pnl < val)) return false;
        if (filters.pnlOperator === "=" && !(t.pnl === val)) return false;
      }

      // RR filter
      if (filters.rrValue) {
        const val = Number(filters.rrValue);
        if (filters.rrOperator === ">" && !(t.rr > val)) return false;
        if (filters.rrOperator === "<" && !(t.rr < val)) return false;
        if (filters.rrOperator === "=" && !(t.rr === val)) return false;
      }

      // Date range filter
      if (filters.startDate || filters.endDate) {
        const tradeDate = new Date(t.dateNtime);
        if (filters.startDate && tradeDate < new Date(filters.startDate))
          return false;
        if (filters.endDate && tradeDate > new Date(filters.endDate))
          return false;
      }

      // Trade number range
      if (
        filters.startTradeNumber &&
        t.tradeNumber < Number(filters.startTradeNumber)
      )
        return false;
      if (
        filters.endTradeNumber &&
        t.tradeNumber > Number(filters.endTradeNumber)
      )
        return false;

      return true;
    });
  }, [filters, savedTrade]);

  return (
    <section id="trade-history" className={styles.tardehistory}>
      <div className={styles.tradehistorycontainer}>
        <div className={styles.heading}>
          <h3>Trade History</h3>
          <p>Review and analyze all your trades here</p>
        </div>

        {/* 🔥 Advanced Filters */}
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
              Showing {filteredTrades.length} of {savedTrade.length} trades
            </p>
            <button onClick={handleClearFilters}>Clear Filters</button>
          </div>
        </div>

        <TradeCard savedTrade={filteredTrades} />
      </div>
    </section>
  );
};

const TradeCard = ({ savedTrade }) => {
  if (!savedTrade || savedTrade.length === 0)
    return <p className={styles.notrades}>No trades yet</p>;

  return (
    <>
      {savedTrade.map((tradeData, index) => (
        <NavLink key={index} to={`/app/trade/${tradeData.id}`}>
          <div className={styles.tradecard}>
            <div className={styles.logo}>📈</div>

            <div className={styles.symbol}>
              <div>{tradeData.symbol || tradeData.marketType}</div>
              <div className={styles.belowsymbol}>
                <p>{tradeData.marketType}</p>
                <p>{tradeData.dateNtime}</p>
              </div>
            </div>

            <div className={styles.tradequickdata}>
              <div>
                <p>Direction</p>
                <span>{tradeData.tradedirection}</span>
              </div>
              <div>
                <p>RR</p>
                <span>1:{tradeData.rr || "0"}</span>
              </div> 
              <div>
                <p>PNL</p>
                <span>
                  ${tradeData.tradeStatus === "live"
                    ? "Live"
                    : tradeData.pnl !== null && tradeData.pnl !== undefined
                    ? tradeData.pnl
                    : "0"}
                </span>
              </div>
            </div>
          </div>
        </NavLink>
      ))}
    </>
  );
};


