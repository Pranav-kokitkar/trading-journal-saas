import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AddTrade } from "./components/Pages/AddTrade/AddTrade";
import { TradeHistory } from "./components/Pages/TradeHistory/TradeHistory";
import { AddNotes } from "./components/Pages/AddNotes/AddNotes";
import { Trade } from "./components/Pages/Trade/Trade";
import { Layout } from "./components/Layout/Layout";
import { AccountProvider } from "./context/AccountContext";
import { MyAccount } from "./components/Pages/MyAccount/MyAccount";
import { Dashboard } from "./components/Pages/Dashboard/Dashboard";

function ErrorPage() {
  return <h1>Oops! Page not found.</h1>;
}

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "/dashboard",
          element: <Dashboard />,
          errorElement: <ErrorPage />,
        },
        {
          path: "/trade/:id",
          element: <Trade />,
          errorElement: <ErrorPage />,
        },
        {
          path: "/trade-history",
          element: <TradeHistory />,
          errorElement: <ErrorPage />,
        },
        {
          path: "/add-trade",
          element: <AddTrade />,
          errorElement: <ErrorPage />,
        },
        {
          path: "/add-notes",
          element: <AddNotes />,
          errorElement: <ErrorPage />,
        },
        {
          path: "/my-account",
          element: <MyAccount />,
          errorElement: <ErrorPage />,
        },
      ],
      errorElement: <ErrorPage />,
    },
  ],
  { basename: "/trading-journal-saas" }
);

function App() {
  return(
    <AccountProvider>
      <RouterProvider router={router} />
    </AccountProvider>
  )
}

export default App;
