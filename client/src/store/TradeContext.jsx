// src/store/TradeContext.jsx
import { useAuth } from "./Auth";
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { UserContext } from "../context/UserContext";
import toast from "react-hot-toast";
import { AccountContext } from "../context/AccountContext";

export const TradeContext = createContext();

export const TradeProvider = ({ children }) => {
  const userCtx = useContext(UserContext);
  if (!userCtx) {
    console.error(
      "TradeProvider: UserContext is undefined. Make sure <AccountProvider> wraps <TradeProvider>."
    );
  }
  const {user} = useAuth();
  const { updateAccount, accountDetails } = useContext(AccountContext);

  const [trades, setTrades] = useState([]);
  const [totalTrades, setTotalTrades] = useState(0);
  const [loading, setLoading] = useState(true);
  const [accountTrades, setAccountTrades] = useState([]);
  const [includeImportedTrades, setIncludeImportedTrades] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [limit, setLimit] = useState(5);

  const [trade, setTrade] = useState({
    id: "",
    marketType: "",
    symbol: "",
    tradedirection: "",
    entryPrice: "",
    stoplossPrice: "",
    riskType: "",
    takeProfitPrice: "",
    tradeStatus: "",
    exitedPrice: [{ price: "", volume: "" }],
    rr: "",
    pnl: "",
    tradeResult: "",
    riskamount: "",
    riskPercent: "",
    balanceAfterTrade: "",
    tradeNumber: "",
    dateNtime: "",
    tradeNotes: "",
  });

  const { authorizationToken, isLoggedIn } = useAuth();

  const parseIncludeImported = (value, defaultValue = true) => {
    if (value === undefined || value === null || value === "") return defaultValue;
    if (typeof value === "boolean") return value;

    const normalized = String(value).trim().toLowerCase();
    if (["false", "0", "no", "off"].includes(normalized)) return false;
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    return defaultValue;
  };

  async function getAllTrades(filters = {}) {
    if (!isLoggedIn || !authorizationToken) return;

    try {
      setLoading(true);

      // If filters override page/limit, use those; otherwise use state
      const queryPage = filters.page !== undefined ? filters.page : page;
      const queryLimit = filters.limit !== undefined ? filters.limit : limit;
      const shouldIncludeImported = parseIncludeImported(
        filters.includeImported,
        includeImportedTrades,
      );

      const params = new URLSearchParams({
        page: queryPage,
        limit: queryLimit,
        includeImported: shouldIncludeImported ? "true" : "false",
        ...Object.fromEntries(
          Object.entries(filters).filter(
            ([k]) => k !== "page" && k !== "limit" && k !== "includeImported",
          ),
        ),
      }).toString();

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/trades?${params}`,
        {
          headers: { Authorization: authorizationToken },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setTrades(data.trades);
        console.log("trades",data.trades)
        setTotalPages(data.pagination.totalPages);
        setTotalTrades(data.stats?.totalTrades ?? data.stats?.filteredTrades ?? 0);
      }
    } catch (err) {
      console.error("fetch trades error", err);
    } finally {
      setLoading(false);
    }
  }

  async function getAllAccountTrades(targetAccountId = accountDetails?._id, options = {}) {
    if (!isLoggedIn || !authorizationToken) return;

    if (!targetAccountId) {
      setAccountTrades([]);
      return;
    }

    try {
      const shouldIncludeImported = parseIncludeImported(
        options.includeImported,
        includeImportedTrades,
      );

      const allTrades = [];
      const pageLimit = 50;
      let currentPage = 1;
      let totalPagesToFetch = 1;

      do {
        const params = new URLSearchParams({
          page: currentPage,
          limit: pageLimit,
          accountId: targetAccountId,
          includeImported: shouldIncludeImported ? "true" : "false",
        }).toString();

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/trades?${params}`,
          {
            headers: { Authorization: authorizationToken },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to fetch account trades");
        }

        const pageTrades = Array.isArray(data?.trades) ? data.trades : [];
        allTrades.push(...pageTrades);

        totalPagesToFetch = Number(data?.pagination?.totalPages || 1);
        currentPage += 1;
      } while (currentPage <= totalPagesToFetch);

      setAccountTrades(allTrades);
    } catch (err) {
      console.error("fetch account trades error", err);
      setAccountTrades([]);
    }
  }

  const AddTrade = async (normalizedTrade, screenshots = []) => {

    try {
      // ✅ Build FormData instead of raw JSON
      const formData = new FormData();

      // Append all normalizedTrade fields
      Object.entries(normalizedTrade).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        if (key === "tags") {
          // send tags as multiple fields so backend gets an array
          value.forEach((id) => formData.append("tags", id));
        } else if (Array.isArray(value)) {
          // exitedPrice etc.
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });

      // Append up to 2 screenshot files (field name: "screenshots")
      if (Array.isArray(screenshots)) {
        screenshots.slice(0, 2).forEach((file) => {
          if (file) {
            formData.append("screenshots", file);
          }
        });
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/trades/`,
        {
          method: "POST",
          headers: {
            Authorization: authorizationToken,
          },
          body: formData,
        }
      );

      let data = {};
      try {
        data = await response.json();
      } catch (err) {
        // ignore parse error
      }

      if (response.ok) {
        toast.success("Trade added succesfully");
        await getAllTrades();
        await getAllAccountTrades(
          normalizedTrade?.accountId || accountDetails?._id,
        );

        // Update account details after successful add
        try {
          if (typeof updateAccount === "function") {
            await updateAccount({
              pnl: Number(normalizedTrade.pnl || 0),
              deltaTrades: 1,
            });
          }
        } catch (err) {
        }

        // reset local trade state
        setTrade({
          id: "",
          marketType: "",
          symbol: "",
          tradedirection: "",
          entryPrice: "",
          stoplossPrice: "",
          riskType: "",
          takeProfitPrice: "",
          tradeStatus: "",
          exitedPrice: [{ price: "", volume: "" }],
          rr: "",
          pnl: "",
          tradeResult: "",
          riskamount: "",
          riskPercent: "",
          balanceAfterTrade: "",
          tradeNumber: "",
          dateNtime: "",
          tradeNotes: "",
        });
      } else {
        toast.error("Failed to add trade");
      }
    } catch (error) {
      toast.error("Network or unexpected error, try re-Login");
    }
  };

  const closeTradeByID = async (
    id,
    exitedPrice,
    pnl,
    rr,
    tradeResult,
    balanceAfterTrade
  ) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/trades/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            // ensure "Bearer " prefix if your token is raw
            Authorization: authorizationToken?.startsWith("Bearer ")
              ? authorizationToken
              : `Bearer ${authorizationToken}`,
          },
          body: JSON.stringify({
            exitedPrice,
            pnl,
            rr,
            tradeResult,
            balanceAfterTrade,
          }),
        }
      );

      // parse response safely
      let data;
      try {
        data = await response.json();
      } catch (e) {
        const text = await response.text();
        throw new Error(
          `Unexpected server response: ${text || response.status}`
        );
      }

      console.log("closeTradeByID response:", response.status, data);
      await getAllTrades();
      await getAllAccountTrades(accountDetails?._id);

      if (response.ok) {
        toast.success("Trade closed sucessfully");
      } else {
        toast.error("Failed to close tarde");
        const errMsg = data?.message || `HTTP ${response.status}`;
        throw new Error(errMsg);
      }

      // accept either { success:true, trade: {...} } or the trade doc itself
      const returnedTrade = data?.trade ?? data;
      if (!returnedTrade || Object.keys(returnedTrade).length === 0) {
        throw new Error("Server did not return updated trade.");
      }

      // update local trades state: replace matching trade by id/_id
      setTrades((prevTrades) =>
        prevTrades.map((t) =>
          String(t._id ?? t.id) === String(id) ? returnedTrade : t
        )
      );

      // return the updated trade so callers can use it
      return returnedTrade;
    } catch (err) {
      console.error("closeTradeByID error:", err);
      throw err;
    }
  };

  const deleteTradeByID = async (id, pnl) => {

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/trades/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: authorizationToken,
          },
        }
      );
      if (response.ok) {
        toast.success("Trade deleted");
        try {
          if (typeof updateAccount === "function") {
            const pnlToAdjust = -parseFloat(pnl || 0) || 0;
            await updateAccount({ pnl: pnlToAdjust, deltaTrades: -1 });
            await getAllTrades();
            await getAllAccountTrades(accountDetails?._id);
          }
        } catch (err) {
          console.error("updateAccount failed on delete", err);
        }
      } else {
        toast.error("Failed to delete trade");
      }
    } catch (err) {
      toast.error("Failed to delete trade, try re-login");
    }
  }

  useEffect(() => {
    if (isLoggedIn && authorizationToken) {
      getAllTrades();
    }
  }, [isLoggedIn, authorizationToken, includeImportedTrades]);
  
  useEffect(() => {
    if (!isLoggedIn || !authorizationToken) {
      setAccountTrades([]);
      return;
    }

    getAllAccountTrades(accountDetails?._id, {
      includeImported: includeImportedTrades,
    });
  }, [isLoggedIn, authorizationToken, accountDetails?._id, includeImportedTrades]);

  return (
    <TradeContext.Provider
      value={{
        AddTrade,
        trades,
        trade,
        setTrade,
        refreshTrades: getAllTrades,
        refreshAllAccountTrades: getAllAccountTrades,
        closeTradeByID,
        deleteTradeByID,
        accountTrades,
        includeImportedTrades,
        setIncludeImportedTrades,
        page,
        setPage,
        loading,
        totalPages,
        totalTrades,
      }}
    >
      {children}
    </TradeContext.Provider>
  );
};

export const useTrades = () => useContext(TradeContext);
