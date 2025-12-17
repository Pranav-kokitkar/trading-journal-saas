import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../../../store/Auth";

const AdminContactContext = createContext();

export const  AdminContactsProvider =({children})=>{
    const [contacts, setContacts] = useState(null);
      const [loading, setLoading] = useState(true);
      const [contactModal, setContactModal] = useState(false);
      const [selectedContact, setSelectedContact] = useState(null);
    
      const { authorizationToken } = useAuth();
    
      const getAllContacts = async () => {
        try {
          setLoading(true);
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/admin/contact`,
            {
              method: "GET",
              headers: {
                Authorization: authorizationToken,
              },
            }
          );
          const res_data = await response.json();
          if (response.ok) {
            setContacts(res_data);
            setLoading(false);
          } else {
            console.log("failed to get contacts");
            setLoading(false);
          }
        } catch (error) {
          console.log(error);
          setLoading(false);
        }
      };
    
      const deleteContact = async (id) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/contact/${id}`,{
                method:"DELETE",
                headers:{
                    Authorization:authorizationToken
                }
            });
            if(!response.ok){
                return console.log("failed to delete constsct")
            }
            setContacts((prev) => prev.filter((c) => c._id !== id));
            console.log('deleted')
        } catch (error) {
            console.log(error);
        }
      }
    
      useEffect(() => {
        if (authorizationToken) {
          getAllContacts();
        }
      }, [authorizationToken]);
    
      const showContact = (c) => {
        setContactModal(true);
        setSelectedContact(c);
      };

      const onClose =()=>{
        setSelectedContact(null);
            setContactModal(false);
      }
    return(
        <AdminContactContext.Provider value={{contacts, loading, contactModal,selectedContact, deleteContact, showContact, onClose}}>
            {children}
        </AdminContactContext.Provider>
    )
}

export const useAdminContacts =()=>{
    return useContext(AdminContactContext);
}