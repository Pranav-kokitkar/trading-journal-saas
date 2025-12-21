import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../../../store/Auth";

const AdminTradeContext = createContext();

export const AdminTradesProvider = ({children})=>{

    const [trades, setTrades]= useState([]);
    const [totalTrades, setTotalTrades] = useState(null);
    const [totalLiveTrades, setTotalLiveTrades] = useState(null);
    const [totalExitedTrades, setTotalExitedTrades] =useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingTrades, setLoadingTrades] = useState(true);

    const [page, setPage] = useState(1);
    const [limit , setLimit] = useState(9);
    const [totalPages, setTotalPages] = useState(1);

    const {authorizationToken} = useAuth();

    const getAllTrades = async ({ initial = false } = {}) => {
      try {
        if (initial) {
          setLoading(true);
        } else {
          setLoadingTrades(true);
        }
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/admin/trades?page=${page}&limit=${limit}`,
          {
            method: "GET",
            headers: {
              Authorization: authorizationToken,
            },
          }
        );
        const res_data = await response.json();
       
        if (response.ok) {
          setTrades(res_data.trades);
          setTotalTrades(res_data.stats.totalTrades);
          setTotalExitedTrades(res_data.stats.totalExitedTrades);
          setTotalLiveTrades(res_data.stats.totalLiveTrades);
          setTotalPages(res_data.pagination.totalPages);
          setLimit(res_data.pagination.limit);
        } else {
          console.log("failed to get all trades for admin");
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
        setLoadingTrades(false);
      }
    };

    useEffect(()=>{
        if(authorizationToken){
            getAllTrades({initial:true});
        }
    },[authorizationToken]);

    useEffect(()=>{
        if(authorizationToken){
            getAllTrades({initial:false})
        }
    },[page])


    return (
      <AdminTradeContext.Provider
        value={{
          trades,
          loading,
          loadingTrades,
          page,
          setPage,
          totalTrades,
          totalPages,
          totalExitedTrades,
          totalLiveTrades,
        }}
      >
        {children}
      </AdminTradeContext.Provider>
    );
}

export const useAdminTrades =()=>{
    return useContext(AdminTradeContext);
}