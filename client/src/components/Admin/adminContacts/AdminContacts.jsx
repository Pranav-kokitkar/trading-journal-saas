import styles from "./AdminContacts.module.css";
import { AdminContactModal } from "./AdminContactModal";
import { useAdminContacts } from "../store/AdminContactsContext";

export const AdminContacts = () => {
  
  const {contacts, loading, contactModal,selectedContact, deleteContact, showContact, onClose}= useAdminContacts();

  if (loading) {
    return <p className={styles.empty}>Loading...</p>;
  }

  return (
    <section className={styles.container}>
      {contactModal && selectedContact && (
        <AdminContactModal
          contact={selectedContact}
          onClose={onClose}
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
