import styles from "./DisplayNotes.module.css";
import { useAuth } from "../../../store/Auth";
import { toast } from "react-toastify";
export const DisplayNotes = ({ notes, getAllNotes }) => {
  const { authorizationToken } = useAuth();

  const deleteNote = async (id) => {
    if (!window.confirm("Delete this Note This cannot be undone.")) return;
    try {
      const response = await fetch(`http://localhost:3000/api/notes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: authorizationToken,
        },
      });
      if (response.ok) {
        await getAllNotes();
        toast.success("Note deleted", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      } else {
        toast.error("Failed to delet note", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  if (!notes || notes.length === 0)
    return <p className={styles.nonotes}>No Notes yet</p>;
  return (
    <div className={styles.notessection} >
      <div className={styles.notes}>
        <h3>Saved Notes :</h3>
        <div>
          {notes.map((n) => (
            <div key={n._id} className={styles.noteCard}>
              <div className={styles.notedata}>
                <h4 className={styles.noteTitle}>{n.title}</h4>
                <p className={styles.noteDescription}>{n.description}</p>
              </div>
              <div className={styles.notecarddelete}>
                <button
                  onClick={() => {
                    deleteNote(n._id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
