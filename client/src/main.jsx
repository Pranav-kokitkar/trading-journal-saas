import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./store/Auth.jsx";
import { TradeProvider } from "./store/TradeContext.jsx";
import { PerformanceProvider } from "./context/PerformanceContext.jsx";
import { UserProvider } from "./context/UserContext.jsx";
import { AccountProvider } from "./context/AccountContext.jsx";
import { Toaster } from "react-hot-toast";
import { toastConfig } from "./utils/toastConfig.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <UserProvider>
        <AccountProvider>
          <TradeProvider>
            <PerformanceProvider>
              <App />
              <Toaster
                position={toastConfig.position}
                reverseOrder={false}
                gutter={8}
                toastOptions={toastConfig}
              />
            </PerformanceProvider>
          </TradeProvider>
        </AccountProvider>
      </UserProvider>
    </AuthProvider>
  </StrictMode>
);
