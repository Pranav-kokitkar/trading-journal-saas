import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../../../store/Auth";

const AdminContactContext = createContext();

export const AdminContactsProvider = ({ children }) => {
  const [contacts, setContacts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [contactModal, setContactModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [totalContacts ,setTotalContacts] = useState(null);
  const [totalOpen, setTotalOpen ] =useState(null);
  const [totalInProgress, setTotalInProgress ] =useState(null);
  const [totalResolved, setTotalResolved] =useState(null);
  const [totalPages, setTotalPages] = useState(null);

  const { authorizationToken } = useAuth();

  const getAllContacts = async ({ initial = false } = {}) => {
    try {
      if (initial) {
        setLoading(true);
      } else {
        setLoadingContacts(true);
      }
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/admin/contact?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            Authorization: authorizationToken,
          },
        }
      );
      const res_data = await response.json();
      console.log(res_data);
      if (response.ok) {
        setContacts(res_data.contacts);
        setTotalContacts(res_data.stats.totalContacts);
        setTotalOpen(res_data.stats.totalOpen);
        setTotalInProgress(res_data.stats.totalInProgress);
        setTotalResolved(res_data.stats.totalResolved);
        setTotalPages(res_data.pagination.totalPages);
      } else {
        console.log("failed to get contacts");
        
      }
    } catch (error) {
      console.log(error);
      
    }finally{
        setLoading(false);
        setLoadingContacts(false);
    }
  };

  const deleteContact = async (id) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/contact/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: authorizationToken,
          },
        }
      );
      if (!response.ok) {
        return console.log("failed to delete constsct");
      }
      setContacts((prev) => prev.filter((c) => c._id !== id));
      console.log("deleted");
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (authorizationToken) {
      getAllContacts({inital:true});
    }
  }, [authorizationToken]);

  useEffect(()=>{
    if(authorizationToken){
      getAllContacts({initial:false});
    }
  }, [page])

  const showContact = (c) => {
    setContactModal(true);
    setSelectedContact(c);
  };

  const onClose = () => {
    setSelectedContact(null);
    setContactModal(false);
  };
  return (
    <AdminContactContext.Provider
      value={{
        contacts,
        loading,
        contactModal,
        selectedContact,
        deleteContact,
        showContact,
        onClose,
        page,
        setPage,
        totalContacts,
        totalPages,
        loadingContacts,
        totalOpen,
        totalInProgress,
        totalResolved
      }}
    >
      {children}
    </AdminContactContext.Provider>
  );
};

export const useAdminContacts = () => {
  return useContext(AdminContactContext);
};
