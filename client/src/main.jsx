import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./store/Auth.jsx";
import { ToastContainer, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TradeProvider } from "./store/TradeContext.jsx";
import { PerformanceProvider } from "./context/PerformanceContext.jsx";
import { UserProvider } from "./context/UserContext.jsx";
import { AccountProvider } from "./context/AccountContext.jsx";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <UserProvider>
      <AccountProvider>
        <TradeProvider>
          <PerformanceProvider>
            <StrictMode>
              <App />
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick={false}
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
                transition={Bounce}
              />
            </StrictMode>
          </PerformanceProvider>
        </TradeProvider>
      </AccountProvider>
    </UserProvider>
  </AuthProvider>
);
