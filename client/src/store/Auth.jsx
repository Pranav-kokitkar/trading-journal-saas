import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const authorizationToken = `Bearer ${token}`;
  const isLoggedIn = !!token;

  const storeTokenInLS = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("hasSeenUpgradeModal");
    setToken("");
    setUser(null);
    setIsAdmin(false);
    toast.success("logout successful");
  };

  const userAuthentication = async () => {
    setIsAuthLoading(true);

    if (!token) {
      console.log("No token found, skipping user fetch");
      setUser(null);
      setIsAdmin(false);
      setIsAuthLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/user`,
        {
          method: "GET",
          headers: {
            Authorization: authorizationToken,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUser(data.userData || null);
        setIsAdmin(Boolean(data.userData?.isAdmin));
        console.log("Fetched user:", data);
        setIsAuthLoading(false);
      } else {
        console.log("Error while fetching user data (non-OK). Clearing auth.");
        localStorage.removeItem("token");
        setToken("");
        setUser(null);
        setIsAdmin(false);
        setIsAuthLoading(false);
      }
    } catch (error) {
      console.log("Error while fetching user data", error);
      localStorage.removeItem("token");
      setToken("");
      setUser(null);
      setIsAdmin(false);
      setIsAuthLoading(false);
    }
  };

const isPro = Boolean(
  user?.plan === "pro" &&
    user?.planExpiresAt &&
    new Date(user.planExpiresAt) > new Date()
);


  useEffect(() => {
    userAuthentication();
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        storeTokenInLS,
        logoutUser,
        isLoggedIn,
        user,
        authorizationToken,
        userAuthentication,
        isAdmin,
        isAuthLoading,
        token,
        isPro
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
