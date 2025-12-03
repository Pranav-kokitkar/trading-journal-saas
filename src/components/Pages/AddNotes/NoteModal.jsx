import { useState } from "react";
import styles from "./NoteModal.module.css";

export const NoteModal = ({ note, onClose, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [updatedNote, setUpdatedNote] = useState({
    title: "",
    description: "",
  });

  const handelInput = (e) => {
    let name = e.target.name;
    let value = e.target.value;
    setUpdatedNote({
      ...updatedNote,
      [name]: value,
    });
  };

  const handleEdit = () => {
    if (!isEditing) {
      setUpdatedNote({
        title: note.title,
        description: note.description,
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    onUpdate({
      title: updatedNote.title || note.title,
      description: updatedNote.description || note.description,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setUpdatedNote({
      title: "",
      description: "",
    });
  };

  if (!note) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          {isEditing ? (
            <input
              type="text"
              value={updatedNote.title || note.title}
              onChange={handelInput}
              name="title"
              className={styles.editTitleInput}
            />
          ) : (
            <h4 className={styles.noteTitle}>{note.title}</h4>
          )}
          <button className={styles.modalCloseButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {isEditing ? (
            <textarea
              value={updatedNote.description || note.description}
              onChange={handelInput}
              name="description"
              className={styles.editTextArea}
            />
          ) : (
            <p className={styles.noteDescription}>
              {note.description ?? note.note ?? ""}
            </p>
          )}
        </div>

        <div className={styles.modalFooter}>
          {!isEditing ? (
            <>
              <button className={styles.editButton} onClick={handleEdit}>
                Edit
              </button>
              <button className={styles.deleteButton} onClick={onDelete}>
                Delete
              </button>
            </>
          ) : (
            <>
              <button className={styles.saveButton} onClick={handleSave}>
                Save
              </button>
              <button className={styles.cancelButton} onClick={handleCancel}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
