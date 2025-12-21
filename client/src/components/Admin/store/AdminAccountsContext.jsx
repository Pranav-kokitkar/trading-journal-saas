import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../../../store/Auth";

const AdminAccountsContext = createContext();

export const AdminAccountsProvider = ({ children }) => {
  const { authorizationToken } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [limit , setLimit] = useState(3);
  const [totalAccounts, setTotalAccounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const totalPages = limit ? Math.ceil(totalAccounts / limit) : 0;

  const [activeAccounts, setActiveAccounts] = useState(0);
  const [disabledAccounts, setDisabledAccounts] = useState(0);

  const [page, setPage] = useState(1);

  const getAllAccounts = async ({ initial = false } = {}) => {
    try {
      if (initial) {
        setLoading(true);
      } else {
        setLoadingAccounts(true);
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/admin/account?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            Authorization: authorizationToken,
          },
        }
      );

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

  useEffect(() => {
    if (authorizationToken) {
      getAllAccounts({ initial: true });
    }
  }, [authorizationToken]);

  useEffect(() => {
    if (authorizationToken) {
      getAllAccounts({ initial: false });
    }
  }, [page]);

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
        disabledAccounts
      }}
    >
      {children}
    </AdminAccountsContext.Provider>
  );
};

export const useAdminAccounts = () => {
  return useContext(AdminAccountsContext);
};
