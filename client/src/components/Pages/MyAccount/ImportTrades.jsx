import { useState } from "react";
import { useTrades } from "../../../store/TradeContext";
import styles from "./ImportTrades.module.css";

export const ImportTrades = ({
  isOpen,
  onClose,
  accountId,
  authorizationToken,
}) => {
  const { refreshTrades, refreshAllAccountTrades } = useTrades();
  const [csvFile, setCsvFile] = useState(null);
  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const clearMessages = () => {
    setError("");
    setResult(null);
  };

  const importCsv = async () => {
    clearMessages();

    if (!csvFile) {
      setError("Please select a CSV file.");
      return;
    }

    if (!authorizationToken) {
      setError("You are not authenticated.");
      return;
    }

    const formData = new FormData();
    formData.append("file", csvFile);
    if (accountId) {
      formData.append("accountId", accountId);
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/trades/import`,
        {
          method: "POST",
          headers: {
            Authorization: authorizationToken,
          },
          body: formData,
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "CSV import failed.");
      }

      setResult(data);
      
      // Refresh visible list + full account trades used by dashboard calculations
      await Promise.all([
        refreshTrades({ page: 1, limit: 50, accountId }),
        refreshAllAccountTrades(accountId),
      ]);
    } catch (err) {
      setError(err.message || "CSV import failed.");
    } finally {
      setLoading(false);
    }
  };

  const importJson = async () => {
    clearMessages();

    if (!jsonText.trim()) {
      setError("Please paste a JSON array.");
      return;
    }

    if (!authorizationToken) {
      setError("You are not authenticated.");
      return;
    }

    let parsedTrades;
    try {
      parsedTrades = JSON.parse(jsonText);
    } catch {
      setError("Invalid JSON format.");
      return;
    }

    if (!Array.isArray(parsedTrades)) {
      setError("JSON must be an array of trades.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/trades/import`,
        {
          method: "POST",
          headers: {
            Authorization: authorizationToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountId,
            trades: parsedTrades,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "JSON import failed.");
      }

      setResult(data);
      
      // Refresh visible list + full account trades used by dashboard calculations
      await Promise.all([
        refreshTrades({ page: 1, limit: 50, accountId }),
        refreshAllAccountTrades(accountId),
      ]);
    } catch (err) {
      setError(err.message || "JSON import failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Import Trades</h3>
          <button type="button" onClick={onClose} disabled={loading}>
            ✕
          </button>
        </div>

        <p className={styles.helpText}>
          Import trades using CSV file or JSON array.
        </p>

        {!accountId && (
          <p className={styles.warning}>No active account selected. Please select an account first.</p>
        )}

        <div className={styles.block}>
          <h4>Option A: CSV Upload</h4>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            disabled={loading}
          />
          <button
            type="button"
            onClick={importCsv}
            disabled={loading || !accountId}
          >
            {loading ? "Importing..." : "Upload CSV"}
          </button>
        </div>

        <div className={styles.block}>
          <h4>Option B: JSON Input</h4>
          <textarea
            rows={8}
            placeholder='Paste JSON array here, e.g. [{"symbol":"EURUSD", ...}]'
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            disabled={loading}
          />
          <button
            type="button"
            onClick={importJson}
            disabled={loading || !accountId}
          >
            {loading ? "Importing..." : "Import JSON"}
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {result && (
          <div className={styles.result}>
            <p className={styles.success}>Import completed successfully.</p>
            <p>Total Imported: {result.totalImported ?? 0}</p>
            <p>Tags Created: {result.tagsCreated ?? 0}</p>
            <p>Strategies Created: {result.strategiesCreated ?? 0}</p>

            {Array.isArray(result.failedRows) && result.failedRows.length > 0 && (
              <div className={styles.failedRows}>
                <h4>Failed Rows</h4>
                <ul>
                  {result.failedRows.map((item, index) => (
                    <li key={`${item.row || "unknown"}-${index}`}>
                      Row {item.row || "?"}: {item.reason || "Unknown error"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
