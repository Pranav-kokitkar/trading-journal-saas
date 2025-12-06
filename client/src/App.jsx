import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AddTrade } from "./components/Pages/AddTrade/AddTrade";
import { TradeHistory } from "./components/Pages/TradeHistory/TradeHistory";
import { AddNotes } from "./components/Pages/AddNotes/AddNotes";
import { Trade } from "./components/Pages/Trade/Trade";
import { Layout } from "./components/Layout/Layout";
import { MyAccount } from "./components/Pages/MyAccount/MyAccount";
import { Dashboard } from "./components/Pages/Dashboard/Dashboard";
import { Register } from "./components/Pages/Authorization/Register";
import { Login } from "./components/Pages/Authorization/Login";
import { HomePage } from "./components/Pages/Homepage/HomePage";
import { ErrorPage } from "./components/Pages/Error/ErrorPage";
import { ProtectedRoute } from "./components/Pages/Authorization/ProtectedRoute";
import { Contact } from "./components/Pages/Contact/Contact";

const router = createBrowserRouter([
  // Public Routes
  {
    path: "/",
    element: <HomePage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/register",
    element: <Register />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/login",
    element: <Login />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/contact",
    element: <Contact />,
    errorElement: <ErrorPage />,
  },

  // Protected App Routes
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
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
      {
        path: "contact",
        element: <Contact />,
        errorElement: <ErrorPage />,
      },

      // Default child → /app/dashboard
      { index: true, element: <Dashboard /> },
    ],
  },

  // Catch all
  {
    path: "*",
    element: <ErrorPage />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
