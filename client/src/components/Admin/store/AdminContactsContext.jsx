import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useAuth } from "../../../store/Auth";

const AdminContactContext = createContext();

export const AdminContactsProvider = ({ children }) => {
  const { authorizationToken } = useAuth();

  // Data state
  const [contacts, setContacts] = useState([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [totalOpen, setTotalOpen] = useState(0);
  const [totalInProgress, setTotalInProgress] = useState(0);
  const [totalResolved, setTotalResolved] = useState(0);

  // UI state
  const [loading, setLoading] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactModal, setContactModal] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  /* =========================
     GET ALL CONTACTS
  ========================= */
  const getAllContacts = async ({ initial = false } = {}) => {
    try {
      initial ? setLoading(true) : setLoadingContacts(true);

      let url = `${
        import.meta.env.VITE_API_URL
      }/api/admin/contact?page=${page}&limit=${limit}`;

      if (search) url += `&search=${search}`;
      if (status !== "all") url += `&status=${status}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: authorizationToken,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to fetch contacts");
        return;
      }

      setContacts(data.contacts);
      setTotalContacts(data.stats.totalContacts);
      setTotalOpen(data.stats.totalOpen);
      setTotalInProgress(data.stats.totalInProgress);
      setTotalResolved(data.stats.totalResolved);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingContacts(false);
    }
  };

  /* =========================
     UPDATE STATUS
  ========================= */
  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/contact/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: authorizationToken,
          },
          body: JSON.stringify(newStatus),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Update failed:", data.message);
        return;
      }

      await getAllContacts();
      onClose();
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  /* =========================
     DELETE CONTACT
  ========================= */
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

      const data = await response.json();

      if (!response.ok) {
        console.error("Delete failed:", data.message);
        return;
      }

      // Handle edge case: deleting last item on page
      if (contacts.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await getAllContacts();
      }
    } catch (error) {
      console.error("Failed to delete contact", error);
    }
  };

  /* =========================
     RESET FILTERS
  ========================= */
  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setPage(1);
  };

  /* =========================
     MODAL HELPERS
  ========================= */
  const showContact = (contact) => {
    setSelectedContactId(contact._id);
    setContactModal(true);
  };

  const onClose = () => {
    setSelectedContactId(null);
    setContactModal(false);
  };

  /* =========================
     DERIVED CONTACT
  ========================= */
  const selectedContact = useMemo(() => {
    if (!selectedContactId) return null;
    return contacts.find((c) => c._id === selectedContactId) || null;
  }, [contacts, selectedContactId]);

  /* =========================
     EFFECTS
  ========================= */
  useEffect(() => {
    if (authorizationToken) {
      getAllContacts({ initial: true });
    }
  }, [authorizationToken]);

  useEffect(() => {
    if (authorizationToken) {
      getAllContacts();
    }
  }, [page, search, status, authorizationToken]);

  return (
    <AdminContactContext.Provider
      value={{
        contacts,
        loading,
        loadingContacts,
        contactModal,
        selectedContact,
        showContact,
        onClose,
        updateStatus,
        deleteContact,
        page,
        setPage,
        totalContacts,
        totalPages,
        totalOpen,
        totalInProgress,
        totalResolved,
        search,
        setSearch,
        status,
        setStatus,
        resetFilters,
      }}
    >
      {children}
    </AdminContactContext.Provider>
  );
};

export const useAdminContacts = () => {
  const context = useContext(AdminContactContext);
  if (!context) {
    throw new Error(
      "useAdminContacts must be used within AdminContactsProvider"
    );
  }
  return context;
};
