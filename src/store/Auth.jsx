import { createContext, useContext } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const storeTokenInLS = (token) => {
    localStorage.setItem("token", token);
    console.log("token stored in ls");
  };

  const logoutUser = ()=>{
    localStorage.removeItem("token");
    console.log("logout sucessful")
  }

  return <AuthContext.Provider value={{storeTokenInLS, logoutUser}}>{children}</AuthContext.Provider>;
};


export const useAuth =()=>{
    return useContext(AuthContext);
}