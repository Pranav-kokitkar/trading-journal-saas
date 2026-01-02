// src/store/TradeContext.jsx
import { useAuth } from "./Auth";
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { UserContext } from "../context/UserContext";
import { toast } from "react-toastify";
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

  const mountedRef = useRef(true);

  async function getAllTrades(filters = {}) {
    if (!isLoggedIn || !authorizationToken) return;

    try {
      setLoading(true);

      const params = new URLSearchParams({
        page,
        limit,
        ...filters,
      }).toString();

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/trades?${params}`,
        {
          headers: { Authorization: authorizationToken },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setTrades(data.trades || []);
        setTotalPages(data.pagination.totalPages);
        setTotalTrades(data.stats.totalTrades);
      }
    } catch (err) {
      console.error("fetch trades error", err);
    } finally {
      setLoading(false);
    }
  }

  const AddTrade = async (normalizedTrade, screenshots = []) => {

    try {
      // ✅ Build FormData instead of raw JSON
      const formData = new FormData();

      // Append all normalizedTrade fields
      Object.entries(normalizedTrade).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        if (Array.isArray(value)) {
          // e.g. exitedPrice -> send as JSON string
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
        toast.success("Trade added succesfully", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });

        // Refresh trades list after new trade added
        await getAllTrades();

        // Update account details after successful add
        try {
          if (typeof updateAccount === "function") {
            await updateAccount({
              pnl: Number(normalizedTrade.pnl || 0),
              deltaTrades: 1,
            });
          } else {
            console.warn("updateAccount is not a function on UserContext");
          }
        } catch (err) {
          console.error("Failed to update account after AddTrade:", err);
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
        toast.error("Failed to add trade", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
        const message =
          data?.message || "Failed to add trade — check console for details";
        alert(message);
      }
    } catch (error) {
      console.error("add trade to db error", error);
      alert("Network or unexpected error — see console");
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

      if (response.ok) {
        toast.success("Trdae close sucessfully", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      } else {
        toast.error("Failed to close tarde", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
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
    if (!window.confirm("Delete this trade? This cannot be undone.")) return;

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
        toast.success("Trade deleted", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
        try {
          if (typeof updateAccount === "function") {
            const pnlToAdjust = -parseFloat(pnl || 0) || 0;
            await updateAccount({ pnl: pnlToAdjust, deltaTrades: -1 });
            await getAllTrades();
          }
        } catch (err) {
          console.error("updateAccount failed on delete", err);
        }
      } else {
        toast.error("Failed to delete trade", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      }
    } catch (err) {
      console.error("Failed to delete trade:", err);
      alert("Failed to delete trade — check console");
    }
  }
  
  useEffect(() => {
    if (!accountDetails?._id) {
      setAccountTrades([]);
      return;
    }

    const filtered = trades.filter((t) => {
      if (!t.accountId) return false;
      return String(t.accountId) === String(accountDetails._id);
    });

    setAccountTrades(filtered);
  }, [trades, accountDetails]);

  return (
    <TradeContext.Provider
      value={{
        AddTrade,
        trades,
        trade,
        setTrade,
        refreshTrades: getAllTrades,
        closeTradeByID,
        deleteTradeByID,
        accountTrades,
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
