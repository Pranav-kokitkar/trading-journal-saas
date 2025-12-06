import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../store/Auth";
import { UserContext } from "./UserContext";

export const AccountContext = createContext();

export const AccountProvider = ({children})=>{

    const [accounts, setAccounts] = useState([]);
    const [accountDetails, setAccountDetails] = useState(null);

    const {authorizationToken, isLoggedIn} = useAuth();
    
    const getAllAccounts = async()=>{
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
            if(response.ok){
                // console.log(res_data);
                setAccounts(res_data);
            }else{
                console.log("failed to get accounts")
            }
        } catch (error) {
            console.log("error while getting accounts",error)
        }
    }

    const getActiveAccount = async()=>{
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
            const res_data = await response.json()
            if(response.ok){
                setAccountDetails(res_data);
            }else{
                console.log("failed to get account deatis");
            }
        } catch (error){
            console.log("error to fetch account detaisl")
        }
    }

    const updateAccount = async (input) => {
      try {
        if (!authorizationToken) return;

        // normalize input to an object { pnl: number, deltaTrades?: number }
        let pnlNum;
        let deltaTradesNum;

        if (typeof input === "number") {
          // support plain number as pnl
          pnlNum = Number(input);
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

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/account/`,
          {
            method: "PATCH",
            headers: {
              Authorization: authorizationToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(bodyObj),
          }
        );

        const result = await response.json();

        if (response.ok) {
          console.log("account details updated", result);

          if (result.account) {
            setAccountDetails(result.account);

            setAccounts((prev) =>
              prev.map((acc) =>
                acc._id === result.account._id ? result.account : acc
              )
            );

            return result.account;
          }

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

    useEffect(()=>{
        if(!isLoggedIn){
            return;
        }
        getAllAccounts();
        getActiveAccount();
    },[])



    return (
      <AccountContext.Provider
        value={{
          accounts,
          getAllAccounts,
          getActiveAccount,
          accountDetails,
          updateAccount,
        }}
      >
        {children}
      </AccountContext.Provider>
    );
}