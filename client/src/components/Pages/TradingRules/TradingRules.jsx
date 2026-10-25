import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../../store/Auth";
import { AccountContext } from "../../../context/AccountContext";
import { API_BASE_URL } from "../../../config/api";
import { TradeHistoryTradeModal } from "../TradeHistory/TradeHistoryTradeModal";
import { FaTrash } from "react-icons/fa";
import styles from "./TradingRules.module.css";

const initialForm = {
  name: "",
  description: "",
  category: "risk_management",
  ruleType: "max_risk_percent",
  config: { maxPercent: 1 },
  severity: "warning",
  enforcementMode: "warning",
  strategyId: "",
  override: false,
  enabled: true,
};

const typeLabels = {
  max_risk_percent: "Maximum risk per trade (%)",
  max_daily_loss: "Maximum daily loss",
  max_trades_per_day: "Maximum trades per day",
  required_stop_loss: "Required stop-loss",
  min_rr: "Minimum risk-to-reward",
  allowed_directions: "Allowed trade directions",
  allowed_sessions: "Allowed trading sessions",
};

const typeConfig = {
  max_risk_percent: { key: "maxPercent", label: "Maximum percentage", type: "number", step: "0.1" },
  max_daily_loss: { key: "maxLoss", label: "Maximum loss in account currency", type: "number", step: "0.01" },
  max_trades_per_day: { key: "maxTrades", label: "Maximum trades", type: "number", step: "1" },
  min_rr: { key: "minRatio", label: "Minimum R:R", type: "number", step: "0.1" },
  allowed_directions: { key: "directions", label: "Directions (comma separated)", type: "text", placeholder: "long, short" },
  allowed_sessions: { key: "sessions", label: "Sessions (comma separated)", type: "text", placeholder: "london, new york" },
};

export const TradingRules = () => {
  const { authorizationToken } = useAuth();
  const navigate = useNavigate();
  const { accountDetails } = useContext(AccountContext);
  const [rules, setRules] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [summary, setSummary] = useState(null);
  const [rulePagination, setRulePagination] = useState({ total: 0, totalPages: 1 });
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ category: "", enabled: "", severity: "", search: "" });
  const [rulePage, setRulePage] = useState(1);
  const [violationPage, setViolationPage] = useState(1);
  const [violationFilters, setViolationFilters] = useState({ search: "", severity: "", ruleId: "", fromDate: "", toDate: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const batchSize = 5;
  const violationBatchSize = 3;
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  const accountId = accountDetails?._id;
  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: authorizationToken, ...(options.headers || {}) },
    });
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : { message: `The API returned an unexpected response (${response.status}). Check that the backend is running and VITE_API_URL points to it.` };
    if (!response.ok) {
      const error = new Error(data.message || "Request failed");
      error.code = data.code;
      throw error;
    }
    return data;
  }, [authorizationToken]);

  const load = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ accountId, page: rulePage, limit: batchSize });
      Object.entries(filters).forEach(([key, value]) => value && query.set(key, value));
      const violationQuery = new URLSearchParams({ accountId, violationPage, violationLimit: violationBatchSize });
      Object.entries(violationFilters).forEach(([key, value]) => value && violationQuery.set(key, value));
      const [ruleData, summaryData, strategyData] = await Promise.all([
        request(`/compliance/rules?${query}`),
        request(`/compliance/summary?${violationQuery}`),
        request("/strategy"),
      ]);
      const nextRules = Array.isArray(ruleData) ? ruleData : (ruleData.rules || []);
      setRules((current) => rulePage === 1
        ? nextRules
        : [...current, ...nextRules.filter((rule) => !current.some((item) => item._id === rule._id))]);
      setRulePagination({
        total: Array.isArray(ruleData) ? nextRules.length : (ruleData.total || 0),
        totalPages: Array.isArray(ruleData) ? 1 : (ruleData.totalPages || 1),
      });
      setSummary((current) => ({
        ...(summaryData || {}),
        violations: violationPage === 1
          ? (summaryData?.violations || [])
          : [...(current?.violations || []), ...(summaryData?.violations || []).filter((item) => !current?.violations?.some((existing) => existing._id === item._id))],
      }));
      setStrategies(strategyData);
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [accountId, filters, rulePage, violationFilters, violationPage, request]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    setRulePage(1);
    setRules([]);
  }, [filters]);
  useEffect(() => {
    setViolationPage(1);
    setSummary((current) => current ? { ...current, violations: [] } : current);
  }, [violationFilters]);

  const configField = typeConfig[form.ruleType];
  const configValue = configField
    ? Array.isArray(form.config[configField.key]) ? form.config[configField.key].join(", ") : (form.config[configField.key] ?? "")
    : "";
  const categoryTypes = useMemo(
    () => (form.category === "risk_management"
      ? ["max_risk_percent", "max_daily_loss", "max_trades_per_day", "required_stop_loss", "min_rr"]
      : ["allowed_directions", "allowed_sessions"]),
    [form.category],
  );

  const resetForm = () => { setForm(initialForm); setEditingId(null); };
  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return toast.error("Rule name is required");
    const config = { ...form.config };
    if (configField) {
      config[configField.key] = ["directions", "sessions"].includes(configField.key)
        ? configValue.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean)
        : Number(configValue);
    }
    try {
      await request(editingId ? `/compliance/rules/${editingId}` : "/compliance/rules", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify({ ...form, accountId, config }),
      });
      toast.success(editingId ? "Rule updated" : "Rule created");
      resetForm();
      setRulePage(1);
      await load();
    } catch (error) {
      setLimitReached(error.code === "ACTIVE_RULE_LIMIT_REACHED");
      toast.error(error.message);
    }
  };

  const edit = (rule) => {
    setEditingId(rule._id);
    setForm({
      ...rule,
      strategyId: rule.strategyId?._id || rule.strategyId || "",
      config: rule.config || {},
    });
  };

  const toggleRule = async (rule) => {
    if (rule.enabled && !window.confirm("Disable this trading rule?")) return;
    try {
      await request(`/compliance/rules/${rule._id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !rule.enabled }),
      });
      toast.success(rule.enabled ? "Rule disabled" : "Rule enabled");
      setRulePage(1);
      await load();
    }
    catch (error) {
      setLimitReached(error.code === "ACTIVE_RULE_LIMIT_REACHED");
      toast.error(error.message);
    }
  };

  const deleteRule = async (rule) => {
    if (!window.confirm(`Delete the "${rule.name}" rule?`)) return;
    try {
      await request(`/compliance/rules/${rule._id}`, { method: "DELETE" });
      toast.success("Rule deleted");
      setRulePage(1);
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const viewTrade = async (tradeId) => {
    const linkedTradeId = typeof tradeId === "object" ? (tradeId?._id || tradeId?.id) : tradeId;
    if (!linkedTradeId) return toast.error("This violation has no linked trade");
    setTradeLoading(true);
    try {
      const trade = await request(`/trades/${linkedTradeId}`);
      setSelectedTrade(trade);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setTradeLoading(false);
    }
  };

  if (!accountId) return <section className={`${styles.page} app-page`}><h1>Trading <span>Rules</span></h1><p>Create an account to configure compliance rules.</p></section>;

  return (
    <section className={`${styles.page} app-page`}>
      <header className="app-page-heading"><h1 className="app-page-title">Trading <span>Rules</span></h1><p>Track account-specific rules without blocking recorded trades.</p></header>
      <div className={styles.summary}>
        <div><strong>{summary?.counts?.pass || 0}</strong><span>Passing checks</span></div>
        <div><strong>{summary?.counts?.violation || 0}</strong><span>Active violations</span></div>
        <div><strong>{summary?.complianceRate == null ? "—" : `${summary.complianceRate}%`}</strong><span>Compliance rate</span></div>
        <div><strong>{summary?.counts?.not_evaluable || 0}</strong><span>Not evaluable</span></div>
      </div>
      {error && <div className={styles.errorState} role="alert"><strong>Unable to load trading rules</strong><span>{error}</span><button type="button" onClick={load}>Retry</button></div>}
      {limitReached && (
        <div className={styles.errorState} role="alert">
          <strong>Free plan active-rule limit reached</strong>
          <span>Disable an active rule or upgrade to Pro to create or enable another rule.</span>
          <button type="button" onClick={() => navigate("/app/upgrade")}>Upgrade to Pro</button>
        </div>
      )}
      <div className={styles.grid}>
        <div className={styles.leftColumn}>
        <div className={styles.card}>
          <div className={styles.listHeader}><div><h2>My Trading Rules</h2><p className={styles.sectionSubtitle}>Manage your account&apos;s trading conditions.</p></div><span>{rulePagination.total} matching rules</span></div>
          <div className={styles.filters}>
            <input aria-label="Search rules" placeholder="Search rules..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}><option value="">All categories</option><option value="risk_management">Risk</option><option value="strategy_execution">Strategy</option></select>
            <select value={filters.enabled} onChange={(e) => setFilters({ ...filters, enabled: e.target.value })}><option value="">All statuses</option><option value="true">Enabled</option><option value="false">Disabled</option></select>
            <select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })}><option value="">All severity</option><option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option></select>
          </div>
          {loading && rules.length === 0 ? <p>Loading rules...</p> : rules.length === 0 ? <p className={styles.empty}>No rules match the current filters.</p> : <div className={styles.rulesScroll}><div className={styles.rules}>{rules.map((rule) => <article className={styles.rule} key={rule._id}><div><strong>{rule.name}</strong><span>{typeLabels[rule.ruleType]} · {rule.strategyId?.name || "All strategies"}</span>{rule.description && <p>{rule.description}</p>}<span className={`${styles.badge} ${styles[rule.severity]}`}>{rule.severity}</span></div><div className={styles.ruleActions}><button type="button" onClick={() => edit(rule)}>Edit</button><button type="button" className={rule.enabled ? styles.disableButton : styles.enableButton} onClick={() => toggleRule(rule)}>{rule.enabled ? "Disable" : "Enable"}</button><button type="button" className={styles.deleteButton} onClick={() => deleteRule(rule)} aria-label={`Delete ${rule.name}`} title="Delete rule"><FaTrash aria-hidden="true" /></button></div></article>)}</div></div>}
          <div className={styles.pagination}><span>Showing {rules.length} of {rulePagination.total} rules</span>{rules.length < rulePagination.total && <button type="button" disabled={loading} onClick={() => setRulePage((page) => page + 1)}>{loading ? "Loading..." : "Show more"}</button>}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.listHeader}><div><h2>Violation History</h2><p className={styles.sectionSubtitle}>Recent recorded rule violations.</p></div><span>{summary?.violationPagination?.total || 0} matching violations</span></div>
          <div className={styles.filters}>
            <input aria-label="Search violations" placeholder="Search rule..." value={violationFilters.search} onChange={(e) => setViolationFilters({ ...violationFilters, search: e.target.value })} />
            <input type="date" aria-label="Violations from date" value={violationFilters.fromDate} onChange={(e) => setViolationFilters({ ...violationFilters, fromDate: e.target.value })} />
            <input type="date" aria-label="Violations to date" value={violationFilters.toDate} onChange={(e) => setViolationFilters({ ...violationFilters, toDate: e.target.value })} />
            <select value={violationFilters.severity} onChange={(e) => setViolationFilters({ ...violationFilters, severity: e.target.value })}><option value="">All severity</option><option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option></select>
          </div>
          {!summary?.violations?.length ? <p className={styles.empty}>No violations match the current filters.</p> : <div className={styles.rulesScroll}><div className={styles.rules}>{summary.violations.map((evaluation) => <article className={styles.rule} key={evaluation._id}><div><strong>{evaluation.ruleId?.name || "Trading rule"}</strong><span>{new Date(evaluation.evaluatedAt).toLocaleString()} · {evaluation.message}</span><p>Actual: {String(evaluation.actual)} · Expected: {String(evaluation.expected)}</p><button className={styles.viewTradeButton} type="button" onClick={() => viewTrade(evaluation.tradeId)} disabled={tradeLoading}>{tradeLoading ? "Loading trade..." : "View trade"}</button></div><span className={`${styles.badge} ${styles.critical}`}>{evaluation.ruleId?.severity || "Violation"}</span></article>)}</div></div>}
          <div className={styles.pagination}><span>Showing {summary?.violations?.length || 0} of {summary?.violationPagination?.total || 0} violations</span>{(summary?.violations?.length || 0) < (summary?.violationPagination?.total || 0) && <button type="button" disabled={loading} onClick={() => setViolationPage((page) => page + 1)}>{loading ? "Loading..." : "Show more"}</button>}</div>
        </div>
        </div>
        <form className={`${styles.card} ${styles.createRuleCard}`} onSubmit={submit}>
          <h2>{editingId ? "Edit rule" : "Create rule"}</h2>
          <label>Name<input placeholder="Example: Maximum risk per trade" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Description<textarea placeholder="Example: Keep risk below 1% on every trade." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, ruleType: e.target.value === "risk_management" ? "max_risk_percent" : "allowed_directions", config: {} })}><option value="risk_management">Risk management</option><option value="strategy_execution">Strategy execution</option></select></label>
          <label>Rule type<select value={form.ruleType} onChange={(e) => setForm({ ...form, ruleType: e.target.value, config: {} })}>{categoryTypes.map((type) => <option key={type} value={type}>{typeLabels[type]}</option>)}</select></label>
          {configField && <label>{configField.label}<input type={configField.type} step={configField.step} placeholder={configField.placeholder} value={configValue} onChange={(e) => setForm({ ...form, config: { ...form.config, [configField.key]: e.target.value } })} /></label>}
          <label>Strategy scope<select value={form.strategyId} onChange={(e) => setForm({ ...form, strategyId: e.target.value })}><option value="">All strategies</option>{strategies.map((strategy) => <option key={strategy._id} value={strategy._id}>{strategy.name}</option>)}</select></label>
          <div className={styles.row}><label>Severity<select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}><option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option></select></label><label>Enabled<select value={String(form.enabled)} onChange={(e) => setForm({ ...form, enabled: e.target.value === "true" })}><option value="true">Enabled</option><option value="false">Disabled</option></select></label></div>
          {form.strategyId && <label className={styles.check}><input type="checkbox" checked={form.override} onChange={(e) => setForm({ ...form, override: e.target.checked })} /> Override the account-level rule of the same type</label>}
          <div className={styles.actions}><button type="submit">{editingId ? "Save changes" : "Add rule"}</button>{editingId && <button type="button" className={styles.secondary} onClick={resetForm}>Cancel</button>}</div>
        </form>
      </div>
      <TradeHistoryTradeModal trade={selectedTrade} onClose={() => setSelectedTrade(null)} page={1} returnTo="/app/trading-rules" />
    </section>
  );
};
