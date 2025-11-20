// src/store/TradeContext.jsx
import { useAuth } from "./Auth";
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { AccountContext } from "../context/AccountContext";

export const TradeContext = createContext();

export const TradeProvider = ({ children }) => {
  const accountCtx = useContext(AccountContext);
  if (!accountCtx) {
    console.error(
      "TradeProvider: AccountContext is undefined. Make sure <AccountProvider> wraps <TradeProvider>."
    );
  }
  const { accountDetails, updateAccount } = accountCtx || {};

  const [trades, setTrades] = useState([]);
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

  const { authorizationToken } = useAuth();

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    // initial fetch when we have a token (or on mount if token already present)
    if (authorizationToken) {
      getAllTrades();
    }
    return () => {
      mountedRef.current = false;
    };
    // only re-run when auth token changes
  }, [authorizationToken]);

  async function getAllTrades() {
    if (!authorizationToken) {
      return;
    }


    try {
      const response = await fetch(`http://localhost:3000/api/trades/`, {
        method: "GET",
        headers: {
          Authorization: authorizationToken,
        },
      });
      const res_data = await response.json();
      if (response.ok) {
        if (mountedRef.current) {
          setTrades(res_data.response || []);
          console.log(
            "trades stored",
            Array.isArray(res_data.response) ? res_data.response.length : 0
          );
        }
      } else {
        console.warn("getAllTrades failed", response.status, res_data);
      }
    } catch (error) {
      console.error("get trades error", error);
    }
  }

  const AddTrade = async (normalizedTrade) => {
    try {
      const response = await fetch("http://localhost:3000/api/trades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authorizationToken,
        },
        body: JSON.stringify(normalizedTrade),
      });

      let data = {};
      try {
        data = await response.json();
      } catch (err) {
        // ignore parse error
      }

      if (response.ok) {
        console.log("trade added to db", data);

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
            console.warn("updateAccount is not a function on AccountContext");
          }
        } catch (err) {
          // non-fatal: trade was added, but account-sync failed — log and allow retry
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

        alert("Trade added successfully");
      } else {
        console.warn("Failed to add trade. Server response:", data);
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
      const response = await fetch(`http://localhost:3000/api/trades/${id}`, {
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
      });

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

      if (!response.ok) {
        // if 409, optionally fetch fresh trade (handled upstream if you want)
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
      const response = await fetch(`http://localhost:3000/api/trades/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: authorizationToken,
        },
      });
      if (response.ok) {
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
        console.log("unable to delete");
      }
    } catch (err) {
      console.error("Failed to delete trade:", err);
      alert("Failed to delete trade — check console");
    }
  };

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
      }}
    >
      {children}
    </TradeContext.Provider>
  );
};

export const useTrades = () => useContext(TradeContext);
