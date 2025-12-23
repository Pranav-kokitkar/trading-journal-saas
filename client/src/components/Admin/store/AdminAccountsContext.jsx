import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../../../store/Auth";

const AdminAccountsContext = createContext();

export const AdminAccountsProvider = ({ children }) => {
  const { authorizationToken } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [limit, setLimit] = useState(3);
  const [totalAccounts, setTotalAccounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const totalPages = limit ? Math.ceil(totalAccounts / limit) : 0;

  const [activeAccounts, setActiveAccounts] = useState(0);
  const [disabledAccounts, setDisabledAccounts] = useState(0);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [page, setPage] = useState(1);

  const getAllAccounts = async ({ initial = false } = {}) => {
    try {
      if (initial) {
        setLoading(true);
      } else {
        setLoadingAccounts(true);
      }

      let url = `${
        import.meta.env.VITE_API_URL
      }/api/admin/account?page=${page}&limit=${limit}`;

      if (search) {
        url += `&search=${search}`;
      }

      if (status) {
        url += `&status=${status}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: authorizationToken,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to fetch accounts:", data);
        return;
      }
      setAccounts(data.accounts);
      setLimit(data.pagination.limit);
      setTotalAccounts(data.stats.totalAccounts);
      setActiveAccounts(data.stats.activeAccounts);
      setDisabledAccounts(data.stats.disabledAccounts);
    } catch (error) {
      console.error("Error while getting accounts:", error);
    } finally {
      setLoading(false);
      setLoadingAccounts(false);
    }
  };

    //  RESET FILTERS

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setPage(1);
  };

  useEffect(() => {
    if (authorizationToken) {
      getAllAccounts({ initial: true });
    }
  }, [authorizationToken]);

  useEffect(() => {
    if (authorizationToken) {
      getAllAccounts({ initial: false });
    }
  }, [page, authorizationToken, search, status]);

  return (
    <AdminAccountsContext.Provider
      value={{
        accounts,
        totalAccounts,
        loading,
        loadingAccounts,
        getAllAccounts,
        page,
        setPage,
        totalPages,
        activeAccounts,
        disabledAccounts,
        setSearch,
        setStatus,
        resetFilters,
      }}
    >
      {children}
    </AdminAccountsContext.Provider>
  );
};

export const useAdminAccounts = () => {
  return useContext(AdminAccountsContext);
};
