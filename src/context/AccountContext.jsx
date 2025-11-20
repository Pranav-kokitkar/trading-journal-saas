// src/context/AccountContext.jsx
import { createContext, useEffect, useState } from "react";
import { useAuth } from "../store/Auth";

export const AccountContext = createContext();

export const AccountProvider = ({ children }) => {
  const { authorizationToken } = useAuth();

  const [accountDetails, setAccountDetails] = useState();

  const getAccount = async () => {
    try {
      if (!authorizationToken) return;

      const response = await fetch(`http://localhost:3000/api/account/`, {
        method: "GET",
        headers: {
          Authorization: authorizationToken,
        },
      });

      const res_data = await response.json();

      if (response.ok) {
        setAccountDetails(res_data);
      } else {
        console.log("failed to fetch account from db", res_data);
      }
    } catch (error) {
      console.log("error while fetching account details", error);
    }
  };

  // FIXED updateAccount (minimal changes only)
  const updateAccount = async (input) => {
    try {
      if (!authorizationToken) return;

      // normalize input to an object { pnl: number, deltaTrades?: number }
      let pnlNum;
      let deltaTradesNum;

      if (typeof input === "number") {
      } else if (typeof input === "object" && input !== null) {
        // try to coerce pnl
        pnlNum = Number(input.pnl);
        if (input.deltaTrades !== undefined) {
          deltaTradesNum = Number(input.deltaTrades);
        }
      } else {
        console.error("updateAccount received invalid value:", input);
        return;
      }

      if (!Number.isFinite(pnlNum)) {
        console.error("updateAccount: pnl is not a finite number:", input);
        return;
      }

      // build body, include deltaTrades only if valid number
      const bodyObj = { pnl: pnlNum };
      if (deltaTradesNum !== undefined && Number.isFinite(deltaTradesNum)) {
        bodyObj.deltaTrades = deltaTradesNum;
      }

      const response = await fetch(`http://localhost:3000/api/account/`, {
        method: "PATCH",
        headers: {
          Authorization: authorizationToken, // unchanged
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyObj),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("account details updated", result);
        if (result.account) {
          setAccountDetails(result.account);
          return result.account;
        }
        // if server didn't return an account, optionally re-fetch
        return result;
      } else {
        console.log("failed to update account details", result);
        return null;
      }
    } catch (error) {
      console.log("error while updating account details", error);
      return null;
    }
  };

  useEffect(() => {
    if (authorizationToken) {
      getAccount();
    }
  }, [authorizationToken]);

  useEffect(() => {
    console.log("accountDetails updated:", accountDetails);
  }, [accountDetails]);

  return (
    <AccountContext.Provider
      value={{
        accountDetails,
        setAccountDetails,
        getAccount,
        updateAccount,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};
