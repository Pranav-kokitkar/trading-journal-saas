import styles from "./AddNotes.module.css";
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
    if (!window.confirm("Delete this note? This cannot be undone.")) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/notes/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: authorizationToken,
          },
        }
      );

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
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/notes/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: authorizationToken,
          },
          body: JSON.stringify(updatedNote),
        }
      );

      if (response.ok) {
        await getAllNotes();
        setShowModal(false);
        setSelectedNote(null);
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
    return (
      <p className={styles.nonotes}>
        No notes yet. Create your first note above!
      </p>
    );
  }

  return (
    <>
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

      <div className={styles.cardContainer}>
        {notes.map((n) => (
          <div
            key={n._id}
            className={styles.noteCard}
            onClick={() => showNote(n)}
          >
            <div className={styles.notedata}>
              <h4 className={styles.noteTitle}>{n.title}</h4>
              <p className={styles.noteDate}>
                Last updated: {formatDate(n.updatedAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
