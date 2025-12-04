// src/context/UserContext.jsx
import { createContext, useEffect, useState } from "react";
import { useAuth } from "../store/Auth";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { authorizationToken } = useAuth();

  const [userDetails, setUserDetails] = useState();

  const getUser = async () => {
    try {
      if (!authorizationToken) return;

      const response = await fetch(`http://localhost:3000/api/user/`, {
        method: "GET",
        headers: {
          Authorization: authorizationToken,
        },
      });

      const res_data = await response.json();

      if (response.ok) {
        setUserDetails(res_data);
      } else {
        console.log("failed to fetch user from db", res_data);
      }
    } catch (error) {
      console.log("error while fetching user details", error);
    }
  };

  // updateUser (renamed from updateAccount)
  const updateUser = async (input) => {
    try {
      if (!authorizationToken) return;

      // normalize input to an object { pnl: number, deltaTrades?: number }
      let pnlNum;
      let deltaTradesNum;

      if (typeof input === "number") {
        // if you ever support plain number, set pnlNum here
        pnlNum = Number(input);
      } else if (typeof input === "object" && input !== null) {
        // try to coerce pnl
        pnlNum = Number(input.pnl);
        if (input.deltaTrades !== undefined) {
          deltaTradesNum = Number(input.deltaTrades);
        }
      } else {
        console.error("updateUser received invalid value:", input);
        return;
      }

      if (!Number.isFinite(pnlNum)) {
        console.error("updateUser: pnl is not a finite number:", input);
        return;
      }

      // build body, include deltaTrades only if valid number
      const bodyObj = { pnl: pnlNum };
      if (deltaTradesNum !== undefined && Number.isFinite(deltaTradesNum)) {
        bodyObj.deltaTrades = deltaTradesNum;
      }

      const response = await fetch(`http://localhost:3000/api/user/`, {
        method: "PATCH",
        headers: {
          Authorization: authorizationToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyObj),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("user details updated", result);
        // adjust this depending on what your API returns
        if (result.user) {
          setUserDetails(result.user);
          return result.user;
        }
        return result;
      } else {
        console.log("failed to update user details", result);
        return null;
      }
    } catch (error) {
      console.log("error while updating user details", error);
      return null;
    }
  };

  useEffect(() => {
    if (authorizationToken) {
      getUser();
    }
  }, [authorizationToken]);

  useEffect(() => {
    console.log("userDetails updated:", userDetails);
  }, [userDetails]);

  return (
    <UserContext.Provider
      value={{
        userDetails,
        setUserDetails,
        getUser,
        updateUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
