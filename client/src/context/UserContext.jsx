// src/context/UserContext.jsx
import { createContext, useEffect, useState } from "react";
import { useAuth } from "../store/Auth";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { authorizationToken, isLoggedIn } = useAuth();

  const [userDetails, setUserDetails] = useState();

  const getUser = async () => {
    try {
      if (!authorizationToken) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/user/`,
        {
          method: "GET",
          headers: {
            Authorization: authorizationToken,
          },
        }
      );

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

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }
    getUser();
  }, [authorizationToken]);

  return (
    <UserContext.Provider
      value={{
        userDetails,
        setUserDetails,
        getUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
