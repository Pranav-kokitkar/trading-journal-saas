import styles from "./DisplayNotes.module.css";
import { useAuth } from "../../../store/Auth";
import { toast } from "react-toastify";
import { useState } from "react";
import { NoteModal } from "./NoteModal";

export const DisplayNotes = ({ notes, getAllNotes }) => {
  const { authorizationToken } = useAuth();

  const [selectedNote, setSelectedNote] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
        setShowModal(false);
        setSelectedNote(null);

        toast.success("Note deleted", {
          position: "top-right",
          autoClose: 2000,
          theme: "dark",
        });
      } else {
        toast.error("Failed to delete note", {
          position: "top-right",
          autoClose: 2000,
          theme: "dark",
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const showNote = (n) => {
    setSelectedNote(n);
    setShowModal(true);
  };

  const updateNote = async (id, updatedNote) => {
    try {
      const response = await fetch(`http://localhost:3000/api/notes/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: authorizationToken,
        },
        body: JSON.stringify(updatedNote),
      });

      if (response.ok) {
        await getAllNotes();
        toast.success("Note updated successfully!", {
          position: "top-right",
          autoClose: 1500,
          theme: "dark",
        });
      } else {
        toast.error("Note update failed!", {
          position: "top-right",
          autoClose: 1500,
          theme: "dark",
        });
      }
    } catch (error) {
      console.log("Error while updating note:", error);
    }
  };

  if (!notes || notes.length === 0) {
    return <p className={styles.nonotes}>No Notes yet</p>;
  }

  return (
    <div className={styles.notessection}>
      {showModal && selectedNote && (
        <NoteModal
          note={selectedNote}
          onClose={() => {
            setShowModal(false);
            setSelectedNote(null);
          }}
          onDelete={() => deleteNote(selectedNote._id)}
          onUpdate={(updatedData) => updateNote(selectedNote._id, updatedData)}
        />
      )}

      <div className={styles.notes}>
        <h3>Saved Notes :</h3>
        <div>
          {notes.map((n) => (
            <div
              key={n._id}
              className={styles.noteCard}
              onClick={() => showNote(n)}
            >
              <div className={styles.notedata}>
                <h4 className={styles.noteTitle}>{n.title}</h4>
                <p className={styles.noteDate}>
                  Last Update: {formatDate(n.updatedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
