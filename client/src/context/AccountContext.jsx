import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../store/Auth";
import { UserContext } from "./UserContext";

export const AccountContext = createContext();

export const AccountProvider = ({children})=>{

    const [accounts, setAccounts] = useState([]);

    const {authorizationToken} = useAuth();
    

    const getAllAccounts = async()=>{
        try {
            const response = await fetch(`http://localhost:3000/api/account/`,{
                method:"GET",
                headers:{
                    "Content-Type":"application/json",
                    Authorization:authorizationToken
                },
            });
            const res_data = await response.json();
            if(response.ok){
                console.log(res_data);
                setAccounts(res_data);
                console.log("acc",accounts);
            }else{
                console("failed to get accounts")
            }
        } catch (error) {
            console.log("error while getting accounts",error)
        }
    }



    useEffect(()=>{
        getAllAccounts();
    },[])



    return(
        <AccountContext.Provider value={ accounts}>
            {children}
        </AccountContext.Provider>
    )
}