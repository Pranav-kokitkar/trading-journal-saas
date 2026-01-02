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

import { AdminProtectedRoute } from "./components/Admin/authorization/AdminProtectedRoute";
import { AdminLayout } from "./components/Admin/adminLayout/AdminLayout";
import { AdminDashboard } from "./components/Admin/adminDashboard/AdminDashboard";
import { AdminUser } from "./components/Admin/adminUsers/AdminUsers";
import { AdminAccounts } from "./components/Admin/adminAccounts/AdminAccounts";
import { AdminUsersProvider } from "./components/Admin/store/AdminUserContext";
import { AdminContacts } from "./components/Admin/adminContacts/AdminContacts";
import { AdminContactsProvider } from "./components/Admin/store/AdminContactsContext";
import { AdminAccountsProvider } from "./components/Admin/store/AdminAccountsContext";
import { AdminAccountDetails } from "./components/Admin/adminAccounts/AdminAccountDetails";
import { AdminTrades } from "./components/Admin/adminTrades/AdminTrades";
import { AdminTradesProvider } from "./components/Admin/store/AdminTradesContext";
import { AdminTradeDetails } from "./components/Admin/adminTrades/AdminTradeDetails";
import { AdminUserDetails } from "./components/Admin/adminUsers/AdminUserDetails";
import { Upgrade } from "./components/Pages/Upgrade/Upgrade";

const router = createBrowserRouter([
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
      {
        path: "upgrade",
        element:<Upgrade/>,
        errorElement:<ErrorPage/>
      },

      { index: true, element: <Dashboard /> },
    ],
  },

  {
    path: "/admin",
    element: (
      <AdminProtectedRoute>
        <AdminUsersProvider>
          <AdminAccountsProvider>
            <AdminTradesProvider>
              <AdminContactsProvider>
                <AdminLayout />
              </AdminContactsProvider>
            </AdminTradesProvider>
          </AdminAccountsProvider>
        </AdminUsersProvider>
      </AdminProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <AdminDashboard />,
      },
      {
        path: "users",
        element: <AdminUser />,
        errorElement: <ErrorPage />,
      },
      {
        path:"user/:id",
        element: <AdminUserDetails/>,
        errorElement: <ErrorPage/>
      },
      {
        path: "contacts",
        element: <AdminContacts />,
        errorElement: <ErrorPage />,
      },
      {
        path: "accounts",
        element: <AdminAccounts />,
        errorElement: <ErrorPage />,
      },
      { path: "trades", element: <AdminTrades />, errorElement: <ErrorPage /> },
      {
        path: "trades/:id",
        element: <AdminTradeDetails />,
        errorElement: <ErrorPage />,
      },
      {
        path: "accounts/:id",
        element: <AdminAccountDetails />,
        errorElement: <ErrorPage />,
      },
      {
        index: true,
        element: <AdminDashboard />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
