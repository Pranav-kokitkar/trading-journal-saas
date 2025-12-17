import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../../../store/Auth";

const AdminAccountsContext = createContext();

export const AdminAccountsProvider = ({ children }) => {
  const { authorizationToken } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const totalAccounts = accounts.length;


  const getAllAccounts = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/account`,
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

      setAccounts(data);
    } catch (error) {
      console.error("Error while getting accounts:", error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (authorizationToken) {
      getAllAccounts();
    }
  }, [authorizationToken]);

  return (
    <AdminAccountsContext.Provider
      value={{
        accounts,
        totalAccounts,
        loading,
        getAllAccounts,
      }}
    >
      {children}
    </AdminAccountsContext.Provider>
  );
};

export const useAdminAccounts = () => {
  return useContext(AdminAccountsContext);
};
