import { createContext, useState } from "react";

export const AccountContext = createContext();

export const AccountProvider=({children})=>{
    const [accountDetails, setAccountDetails] = useState({
        balance:1000
    })

    return(
        <AccountContext.Provider value={{accountDetails, setAccountDetails}}>
            {children}
        </AccountContext.Provider>
    )
}