import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AddTrade } from "./components/Pages/AddTrade/AddTrade";
import { TradeHistory } from "./components/Pages/TradeHistory/TradeHistory";
import { AddNotes } from "./components/Pages/AddNotes/AddNotes";
import { Trade } from "./components/Pages/Trade/Trade";
import { Layout } from "./components/Layout/Layout";
import { AccountProvider } from "./context/AccountContext";
import { MyAccount } from "./components/Pages/MyAccount/MyAccount";
import { Dashboard } from "./components/Pages/Dashboard/Dashboard";
import { PerformanceProvider } from "./context/PerformanceContext";
import { Register } from "./components/Pages/Authorization/Register";
import { Login } from "./components/Pages/Authorization/Login";
import { HomePage } from "./components/Pages/Homepage/HomePage";

function ErrorPage() {
  return <h1>Oops! Page not found.</h1>;
}

const router = createBrowserRouter(
  [
    // Home (no layout / no sidebar)
    {
      path: "/",
      element: <HomePage />,
      errorElement: <ErrorPage />,
    },

    // App pages wrapped by Layout (sidebar, header, etc.)
    {
      path: "/app",
      element: <Layout />,
      children: [
        // NOTE: these are RELATIVE paths (no leading slash)
        {
          path: "dashboard",
          element: <Dashboard />,
          errorElement: <ErrorPage />,
        },
        { path: "trade/:id", element: <Trade />, errorElement: <ErrorPage /> },
        {
          path: "trade-history",
          element: <TradeHistory />,
          errorElement: <ErrorPage />,
        },
        {
          path: "add-trade",
          element: <AddTrade />,
          errorElement: <ErrorPage />,
        },
        {
          path: "add-notes",
          element: <AddNotes />,
          errorElement: <ErrorPage />,
        },
        {
          path: "my-account",
          element: <MyAccount />,
          errorElement: <ErrorPage />,
        },
        // optional: default child route under /app --> redirects to /app/dashboard
        { index: true, element: <Dashboard /> },
      ],
      errorElement: <ErrorPage />,
    },

    // Auth (no layout)
    { path: "/register", element: <Register />, errorElement: <ErrorPage /> },
    { path: "/login", element: <Login />, errorElement: <ErrorPage /> },
  ],
  { basename: "/trading-journal-saas" }
);

function App() {
  return (
    <AccountProvider>
      <PerformanceProvider>
        <RouterProvider router={router} />
      </PerformanceProvider>
    </AccountProvider>
  );
}

export default App;
