import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AddTrade } from "./components/Pages/AddTrade/AddTrade";
import { TradeHistory } from "./components/Pages/TradeHistory/TradeHistory";
import { AddNotes } from "./components/Pages/AddNotes/AddNotes";
import { Sidebar } from "./components/Layout/SideBar";
import { Layout } from "./components/Layout/Layout";

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
          path: "/",
          element: <AddTrade/>,
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
      ],
      errorElement: <ErrorPage />,
    },
  ],
  { basename: "/trading-journal-saas" }
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
