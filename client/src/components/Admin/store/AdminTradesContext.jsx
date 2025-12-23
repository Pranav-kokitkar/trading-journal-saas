import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../../../store/Auth";

const AdminTradeContext = createContext();

export const AdminTradesProvider = ({ children }) => {
  const { authorizationToken } = useAuth();

  // Data state
  const [trades, setTrades] = useState([]);
  const [stats, setStats] = useState({
    totalTrades: 0,
    totalLiveTrades: 0,
    totalExitedTrades: 0,
    totalWins: 0,
    totalLosses: 0,
    totalBreakeven: 0,
    totalPnL: 0,
    avgRR: 0,
    winRate: 0,
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [loadingTrades, setLoadingTrades] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(9);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [tradeStatus, setTradeStatus] = useState("all");
  const [tradeResult, setTradeResult] = useState("all");
  const [accountId, setAccountId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const getAllTrades = async ({ initial = false } = {}) => {
    try {
      if (initial) {
        setLoading(true);
      } else {
        setLoadingTrades(true);
      }

      // Build URL with filters
      let url = `${
        import.meta.env.VITE_API_URL
      }/api/admin/trades?page=${page}&limit=${limit}`;

      if (search) url += `&search=${search}`;
      if (tradeStatus !== "all") url += `&tradeStatus=${tradeStatus}`;
      if (tradeResult !== "all") url += `&tradeResult=${tradeResult}`;
      if (accountId) url += `&accountId=${accountId}`;
      if (dateFrom) url += `&dateFrom=${dateFrom}`;
      if (dateTo) url += `&dateTo=${dateTo}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: authorizationToken,
        },
      });

      const res_data = await response.json();

      if (response.ok) {
        setTrades(res_data.trades);
        setStats(res_data.stats);
        setTotalPages(res_data.pagination.totalPages);
      } else {
        console.error("Failed to get all trades for admin:", res_data);
      }
    } catch (error) {
      console.error("Error fetching trades:", error);
    } finally {
      setLoading(false);
      setLoadingTrades(false);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearch("");
    setTradeStatus("all");
    setTradeResult("all");
    setAccountId("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  // Initial load
  useEffect(() => {
    if (authorizationToken) {
      getAllTrades({ initial: true });
    }
  }, [authorizationToken]);

  // Refetch when filters or page change
  useEffect(() => {
    if (authorizationToken) {
      getAllTrades({ initial: false });
    }
  }, [
    page,
    search,
    tradeStatus,
    tradeResult,
    accountId,
    dateFrom,
    dateTo,
    authorizationToken,
  ]);

  return (
    <AdminTradeContext.Provider
      value={{
        // Data
        trades,
        stats,

        // UI state
        loading,
        loadingTrades,

        // Pagination
        page,
        setPage,
        totalPages,

        // Filters
        search,
        setSearch,
        tradeStatus,
        setTradeStatus,
        tradeResult,
        setTradeResult,
        accountId,
        setAccountId,
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,

        // Actions
        resetFilters,
        getAllTrades,

        // Legacy support (if you want to keep these)
        totalTrades: stats.totalTrades,
        totalLiveTrades: stats.totalLiveTrades,
        totalExitedTrades: stats.totalExitedTrades,
      }}
    >
      {children}
    </AdminTradeContext.Provider>
  );
};

export const useAdminTrades = () => {
  const context = useContext(AdminTradeContext);
  if (!context) {
    throw new Error("useAdminTrades must be used within AdminTradesProvider");
  }
  return context;
};
