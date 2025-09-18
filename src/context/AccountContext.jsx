import { createContext, useEffect, useState } from "react";

export const AccountContext = createContext();

export const AccountProvider = ({ children }) => {
  // Load from localStorage on init
  const [accountDetails, setAccountDetails] = useState(() => {
    const saved = localStorage.getItem("accountDetails");
    return saved
      ? JSON.parse(saved)
      : { initialCapital: 0, balance: 0, totaltrades: 0 }; 
  });

  // Whenever accountDetails changes, sync to localStorage
  useEffect(() => {
    localStorage.setItem("accountDetails", JSON.stringify(accountDetails));
  }, [accountDetails]);

  return (
    <AccountContext.Provider value={{ accountDetails, setAccountDetails }}>
      {children}
    </AccountContext.Provider>
  );
};
