import { createContext, useContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const authorizationToken = `Bearer ${token}`;
  let isLoggedIn = !!token

  const storeTokenInLS = (token) => {
    localStorage.setItem("token", token);
    setToken(token);
    console.log("token stored in ls");
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    console.log("logout successful");
  };

  const userAuthentication = async () => {
    if (!token) {
      console.log("No token found, skipping user fetch");
      return;
    }
    try {
      const response = await fetch(`http://localhost:3000/api/auth/user`, {
        method: "GET",
        headers: {
          Authorization: authorizationToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.userData);
        console.log(data);
      } else {
        console.log("error while fetching user data");
      }
    } catch (error) {
      console.log("error while fetching user data", error);
    }
  };

  // Run when token changes
  useEffect(() => {
      userAuthentication();
  }, []);

  return (
    <AuthContext.Provider value={{ storeTokenInLS, logoutUser, isLoggedIn, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
