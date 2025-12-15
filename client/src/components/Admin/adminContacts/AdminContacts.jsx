import { useEffect, useState } from "react";
import { useAuth } from "../../../store/Auth";
import styles from "./AdminContacts.module.css";
import { AdminContactModal } from "./AdminContactModal";

export const AdminContacts = () => {
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

  if (loading) {
    return <p className={styles.empty}>Loading...</p>;
  }

  return (
    <section className={styles.container}>
      {contactModal && selectedContact && (
        <AdminContactModal
          contact={selectedContact}
          onClose={() => {
            setSelectedContact(null);
            setContactModal(false);
          }}
        />
      )}
      <div className={styles.header}>
        <h2 className={styles.title}>Admin Contacts</h2>
        <p className={styles.count}>Total: {contacts.length}</p>
      </div>

      <div className={styles.list}>
        <DisplayContacts
          contacts={contacts}
          showContact={showContact}
          onDelete={deleteContact}
        />
      </div>
    </section>
  );
};

const DisplayContacts = ({ contacts, showContact, onDelete }) => {
  if (!contacts || contacts.length === 0) {
    return <p className={styles.empty}>No contacts found</p>;
  }

  return (
    <>
      {contacts.map((c) => {
        return (
          <div key={c._id} className={styles.card}>
            <h4 className={styles.subject}>{c.subject}</h4>
            <p className={styles.email}>{c.email}</p>
            <p className={styles.meta}>
              {c.name} • {new Date(c.submittedAt).toLocaleDateString()}
            </p>

            <div className={styles.actions}>
              <button onClick={() => showContact(c)} className={styles.viewBtn}>
                View
              </button>
              <button onClick={()=> onDelete(c._id)} className={styles.deleteBtn}>Delete</button>
            </div>
          </div>
        );
      })}
    </>
  );
};
