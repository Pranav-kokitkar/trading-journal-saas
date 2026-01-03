import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../store/Auth";
import { UserContext } from "./UserContext";
import toast from "react-hot-toast";

export const AccountContext = createContext();

export const AccountProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]);
  const [accountDetails, setAccountDetails] = useState(null);

  const { authorizationToken, isLoggedIn } = useAuth();
  const {getUser} = useContext(UserContext)

  const getAllAccounts = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/account/`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: authorizationToken,
          },
        }
      );
      const res_data = await response.json();
      if (response.ok) {
        setAccounts(res_data);
      } else {
      }
    } catch (error) {
      toast.error("error while getting accounts, try re-login")
    }
  };

  const getActiveAccount = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/account/active-account`,
        {
          method: "GET",
          headers: {
            Authorization: authorizationToken,
          },
        }
      );
      const res_data = await response.json();
      if (response.ok) {
        setAccountDetails(res_data);
      } else {
        toast.error("failed to get account details");
      }
    } catch (error) {
      toast.error("error to fetch account details");
    }
  };

  const updateAccount = async (input) => {
    try {
      if (!authorizationToken) {
        return null;
      }

      // normalize token
      const authHeader = authorizationToken.startsWith("Bearer ")
        ? authorizationToken
        : `Bearer ${authorizationToken}`;

      let pnlNum;
      let deltaTradesNum;

      if (typeof input === "number") {
        pnlNum = Number(input);
      } else if (typeof input === "object" && input !== null) {
        pnlNum = Number(input.pnl);
        if (input.deltaTrades !== undefined) {
          deltaTradesNum = Number(input.deltaTrades);
        }
      } else {
        return null;
      }

      if (!Number.isFinite(pnlNum)) {
        return null;
      }

      const bodyObj = { pnl: pnlNum };
      if (Number.isFinite(deltaTradesNum)) {
        bodyObj.deltaTrades = deltaTradesNum;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/account/`,
        {
          method: "PATCH",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bodyObj),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return null;
      }

      if (result.account) {
        setAccountDetails(result.account);

        setAccounts((prev) =>
          prev.map((acc) =>
            acc._id === result.account._id ? result.account : acc
          )
        );
      }

      return result.account ?? result;
    } catch (error) {
      return null;
    }
  };


  const deleteAccount = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/account/${accountDetails._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: authorizationToken,
          },
        }
      );
      if (response.ok) {
        getAllAccounts();
        getActiveAccount();
        getUser();
        toast.success("account deleted sucessfull");
      } else {
        toast.error("failed to delete account")
      }
    } catch (error) {
      toast.error("failed to delete account, try re-login");
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !authorizationToken) return;

    getAllAccounts();
    getActiveAccount();
  }, [isLoggedIn, authorizationToken]);

  return (
    <AccountContext.Provider
      value={{
        accounts,
        getAllAccounts,
        getActiveAccount,
        accountDetails,
        updateAccount,
        deleteAccount,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};
