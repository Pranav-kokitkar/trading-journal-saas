import { useState, useEffect, useContext } from "react";
import styles from "../../../styles/tradehistory.module.css";
import { useTrades } from "../../../store/TradeContext";
import { TradeCard } from "./TradeCard";
import { Pagination } from "../../Pagination";
import { useAuth } from "../../../store/Auth";
import { AccountContext } from "../../../context/AccountContext";

const defaultFilters = {
  symbol: "",
  marketType: "",
  status: "",
  result: "",
  direction: "",
  strategy: "",
  tag: "",
  pnlOperator: ">",
  pnlValue: "",
  rrOperator: ">",
  rrValue: "",
  startDate: "",
  endDate: "",
  startTradeNumber: "",
  endTradeNumber: "",
  accountId: "", // ✅ ONLY ADDITION
  includeImported: true,
};

export const TradeHistory = () => {
  const {
    trades = [],
    refreshTrades,
    includeImportedTrades,
    setIncludeImportedTrades,
    page,
    setPage,
    totalPages,
    loading,
    totalTrades,
  } = useTrades();

  const [filters, setFilters] = useState(defaultFilters);
  const [strategies, setStrategies] = useState([]);
  const [tags, setTags] = useState([]);
  const [showProTooltip, setShowProTooltip] = useState(null);

  const { isAuthLoading, isPro, authorizationToken } = useAuth();
  const { accounts } = useContext(AccountContext);

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
      setTimeout(() => setShowProTooltip(null), 3000);
    }
  };

  const handleClearFilters = () => {
    setPage(1);
    setFilters({
      ...defaultFilters,
      includeImported: includeImportedTrades,
    });
  };

  const handleIncludeImportedToggle = (e) => {
    const checked = e.target.checked;
    setIncludeImportedTrades(checked);
    setPage(1);
    setFilters((prev) => ({ ...prev, includeImported: checked }));
  };

  const handleDateInputOpen = (e) => {
    const input = e.currentTarget;
    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
      } catch {
        // ignore if browser blocks programmatic open
      }
    }
  };

  /** ---------------- FETCH ---------------- */
  useEffect(() => {
    if (!authorizationToken) return;

    const fetchFilterData = async () => {
      try {
        const [strategyRes, tagRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/strategy?all=true`, {
            headers: { Authorization: authorizationToken },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/tags?all=true`, {
            headers: { Authorization: authorizationToken },
          }),
        ]);

        const [strategyData, tagData] = await Promise.all([
          strategyRes.json(),
          tagRes.json(),
        ]);

        if (strategyRes.ok) setStrategies(Array.isArray(strategyData) ? strategyData : []);
        if (tagRes.ok) setTags(Array.isArray(tagData) ? tagData : []);
      } catch (err) {
        console.error("Failed to fetch strategy/tag filter data:", err);
      }
    };

    fetchFilterData();
  }, [authorizationToken]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, includeImported: includeImportedTrades }));
  }, [includeImportedTrades]);

  useEffect(() => {
    refreshTrades(filters);
  }, [filters, page]);

  const filteredStrategies = filters.accountId
    ? strategies.filter((s) => s.accountId === filters.accountId)
    : strategies;

  const filteredTags = filters.accountId
    ? tags.filter((t) => t.accountId === filters.accountId)
    : tags;

  if (isAuthLoading) return <p>loading...</p>;

  return (
    <section id="trade-history" className={styles.tardehistory}>
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

          {/* ---------------- PNL & RR (UNCHANGED) ---------------- */}
          <div className={styles.filterinput}>
            <div className={styles.filterinputsec}>
              <label>
                PNL {!isPro && <span className={styles.proBadge}>PRO</span>}
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
                RR {!isPro && <span className={styles.proBadge}>PRO</span>}
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

                {showProTooltip === "rr" && !isPro && (
                  <div className={styles.proTooltip}>
                    <span className={styles.tooltipIcon}>!</span>
                    This feature is available in Pro plan
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ---------------- DATE & ACCOUNT ---------------- */}
          <div className={styles.filterinput}>
            <div className={styles.filterinputsec}>
              <label>Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                onClick={handleDateInputOpen}
                onFocus={handleDateInputOpen}
              />
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                onClick={handleDateInputOpen}
                onFocus={handleDateInputOpen}
              />
            </div>

            <div className={styles.filterinputsec}>
              <select
                name="accountId"
                value={filters.accountId}
                onChange={handleFilterChange}
                disabled={accounts.length === 0}
              >
                <option value="">
                  {accounts.length === 0
                    ? "Create an account first"
                    : "All Accounts"}
                </option>
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.name}
                  </option>
                ))}
              </select>

              <select
                name="strategy"
                value={filters.strategy}
                onChange={handleFilterChange}
              >
                <option value="">All Strategies</option>
                {filteredStrategies.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select name="tag" value={filters.tag} onChange={handleFilterChange}>
                <option value="">All Tags</option>
                {filteredTags.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.filter3}>
            <p>Showing {totalTrades} trades</p>
            <label>
              <input
                type="checkbox"
                checked={filters.includeImported}
                onChange={handleIncludeImportedToggle}
              />{" "}
              Include Imported Trades
            </label>
            <button type="button" onClick={handleClearFilters}>
              Clear Filters
            </button>
          </div>
        </div>

        {loading ? <p>Loading trades...</p> : <TradeCard savedTrade={trades} />}

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </section>
  );
};
