import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AddTrade } from "./components/Pages/AddTrade/AddTrade";
import { TradeHistory } from "./components/Pages/TradeHistory/TradeHistory";
import { AddNotes } from "./components/Pages/AddNotes/AddNotes";
import { Trade } from "./components/Pages/Trade/Trade";
import { Layout } from "./components/Layout/Layout";
import { AccountProvider } from "./context/AccountContext";
import { MyAccount } from "./components/Pages/MyAccount/MyAccount";

function ErrorPage() {
  return <h1>Oops! Page not found.</h1>;
}

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Layout/>,
      children: [
        {
          path: "/trade/:id",
          element: <Trade/>,
        },
        {
          path: "/addtrade",
          element: <AddTrade/>,
          errorElement: <ErrorPage />,
        },
        {
          path: "/tradehistory",
          element: <TradeHistory />,
          errorElement: <ErrorPage />,
        },
        {
          path: "/addnotes",
          element: <AddNotes />,
          errorElement: <ErrorPage />,
        },
        {
          path: "/myaccount",
          element: <MyAccount/>,
          errorElement: <ErrorPage/>
        }
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
