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
  const { accountDetails, setAccountDetails } = accountCtx || {};

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

  // guard to prevent concurrent fetches / duplicates
  const isFetchingRef = useRef(false);
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
      // nothing we can do without token
      return;
    }

    // skip if already fetching
    if (isFetchingRef.current) {
      console.debug("getAllTrades: skipping duplicate call (already fetching)");
      return;
    }
    isFetchingRef.current = true;

    // helpful trace (remove later if too noisy)
    console.trace("getAllTrades called");

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
    } finally {
      // small delay to avoid immediate re-trigger storms
      setTimeout(() => {
        isFetchingRef.current = false;
      }, 200);
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
        setAccountDetails((prev = {}) => ({
          ...prev,
          balance: normalizedTrade.balanceAfterTrade,
          totaltrades: (prev.totaltrades || 0) + 1,
        }));

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

  return (
    <TradeContext.Provider
      value={{ AddTrade, trades, trade, setTrade, refreshTrades: getAllTrades }}
    >
      {children}
    </TradeContext.Provider>
  );
};

export const useTrades = () => useContext(TradeContext);
