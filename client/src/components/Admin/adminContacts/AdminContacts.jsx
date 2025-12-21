import styles from "./AdminContacts.module.css";
import { AdminContactModal } from "./AdminContactModal";
import { useAdminContacts } from "../store/AdminContactsContext";
import { Pagination } from "../../Pagination";

export const AdminContacts = () => {
  
  const {
    contacts,
    loading,
    loadingContacts,
    contactModal,
    selectedContact,
    deleteContact,
    showContact,
    onClose,
    page,
    setPage,
    totalContacts,
    totalPages,
    totalOpen,
    totalInProgress,
    totalResolved,
  } = useAdminContacts();

  if (loading) {
    return <p className={styles.empty}>Loading...</p>;
  }

  return (
    <section className={styles.container}>
      {contactModal && selectedContact && (
        <AdminContactModal contact={selectedContact} onClose={onClose} />
      )}
      <div className={styles.header}>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Total</p>
            <p className={styles.statValue}>{totalContacts}</p>
          </div>

          <div className={`${styles.statCard} ${styles.openStat}`}>
            <p className={styles.statLabel}>Open</p>
            <p className={styles.statValue}>{totalOpen}</p>
          </div>

          <div className={`${styles.statCard} ${styles.progressStat}`}>
            <p className={styles.statLabel}>In Progress</p>
            <p className={styles.statValue}>{totalInProgress}</p>
          </div>

          <div className={`${styles.statCard} ${styles.resolvedStat}`}>
            <p className={styles.statLabel}>Resolved</p>
            <p className={styles.statValue}>{totalResolved}</p>
          </div>
      </div>

      <div className={styles.list}>
        {loadingContacts ? (
          <p>loading...</p>
        ) : (
          <DisplayContacts
            contacts={contacts}
            showContact={showContact}
            onDelete={deleteContact}
          />
        )}
      </div>
      <Pagination onPageChange={setPage} page={page} totalPages={totalPages} />
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
            <p className={`${styles.status} ${styles[c.status]}`}>
              {c.status.replace("_", " ")}
            </p>

            <div className={styles.actions}>
              <button onClick={() => showContact(c)} className={styles.viewBtn}>
                View
              </button>
              <button
                onClick={() => onDelete(c._id)}
                className={styles.deleteBtn}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
};
