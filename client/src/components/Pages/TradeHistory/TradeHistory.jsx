import { useState, useEffect } from "react";
import styles from "./TradeHistory.module.css";
import { useTrades } from "../../../store/TradeContext";
import { TradeCard } from "./TradeCard";
import { Pagination } from "../../Pagination";
import { useAuth } from "../../../store/Auth";

const defaultFilters = {
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
};

export const TradeHistory = () => {
  const {
    trades = [],
    refreshTrades,
    page,
    setPage,
    totalPages,
    loading,
    totalTrades,
  } = useTrades();

  const [filters, setFilters] = useState(defaultFilters);
  const [showProTooltip, setShowProTooltip] = useState(null); // 'pnl' or 'rr'

  const { isAuthLoading, isPro } = useAuth();

  /** ---------------- FILTER HANDLERS ---------------- */
  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => {
      setPage(1);
      return { ...prev, [name]: value };
    });
  };

  const handleProFeatureClick = (field) => (e) => {
    if (!isPro) {
      e.preventDefault();
      setShowProTooltip(field);

      // Auto-hide after 3 seconds
      setTimeout(() => {
        setShowProTooltip(null);
      }, 3000);
    }
  };

  const handleClearFilters = () => {
    setPage(1);
    setFilters(defaultFilters);
  };

  /** ---------------- FETCH FROM BACKEND ---------------- */
  useEffect(() => {
    refreshTrades(filters);
  }, [filters, page]);

  if (isAuthLoading) {
    return <p>loading...</p>;
  }

  return (
    <section id="trade-history" className={styles.tardehistory}>
      {/* ---------------- HEADER ---------------- */}
      <div className={styles.heading}>
        <h2 className={styles.title}>
          Trade <span>History</span>
        </h2>
        <p>Review and analyze all your trades here</p>
      </div>

      <div className={styles.tradehistorycontainer}>
        {/* ---------------- FILTER PANEL ---------------- */}
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
              <option value="breakeven">Breakeven</option>
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

          {/* ---------------- PNL & RR ---------------- */}
          <div className={styles.filterinput}>
            <div className={styles.filterinputsec}>
              <label>
                PNL
                {!isPro && <span className={styles.proBadge}>PRO</span>}
              </label>
              <div className={styles.proInputWrapper}>
                <select
                  name="pnlOperator"
                  value={filters.pnlOperator}
                  onChange={handleFilterChange}
                  onClick={handleProFeatureClick("pnl")}
                  disabled={!isPro}
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
                  onClick={handleProFeatureClick("pnl")}
                  disabled={!isPro}
                />

                {/* Tooltip for PnL */}
                {showProTooltip === "pnl" && !isPro && (
                  <div className={styles.proTooltip}>
                    <span className={styles.tooltipIcon}>!</span>
                    This feature is available in Pro plan
                  </div>
                )}
              </div>
            </div>

            <div className={styles.filterinputsec}>
              <label>
                RR
                {!isPro && <span className={styles.proBadge}>PRO</span>}
              </label>
              <div className={styles.proInputWrapper}>
                <select
                  name="rrOperator"
                  value={filters.rrOperator}
                  onChange={handleFilterChange}
                  onClick={handleProFeatureClick("rr")}
                  disabled={!isPro}
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
                  onClick={handleProFeatureClick("rr")}
                  disabled={!isPro}
                />

                {/* Tooltip for RR */}
                {showProTooltip === "rr" && !isPro && (
                  <div className={styles.proTooltip}>
                    <span className={styles.tooltipIcon}>!</span>
                    This feature is available in Pro plan
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ---------------- DATE & TRADE NUMBER ---------------- */}
          <div className={styles.filterinput}>
            <div className={styles.filterinputsec}>
              <label>Date</label>
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
              <label>Trade No</label>
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

          {/* ---------------- FOOTER ---------------- */}
          <div className={styles.filter3}>
            <p>Showing {totalTrades} trades</p>
            <button type="button" onClick={handleClearFilters}>
              Clear Filters
            </button>
          </div>
        </div>

        {/* ---------------- TRADE LIST ---------------- */}
        {loading ? <p>Loading trades...</p> : <TradeCard savedTrade={trades} />}

        {/* ---------------- PAGINATION ---------------- */}
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </section>
  );
};
