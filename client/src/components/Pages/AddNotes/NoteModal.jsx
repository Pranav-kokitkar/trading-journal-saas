import { useState } from "react";
import styles from "./NoteModal.module.css";
import { ConfirmationModal } from "../../modals/ConfirmationModal/ConfirmationModal";
import { useBodyScrollLock } from "../../../hooks/useBodyScrollLock";

export const NoteModal = ({ note, onClose, onDelete, onUpdate }) => {
  useBodyScrollLock(Boolean(note));

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    if (isSaving) return;

    if (!isEditing) {
      setUpdatedNote({
        title: note.title,
        description: note.description,
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      await onUpdate({
        title: updatedNote.title || note.title,
        description: updatedNote.description || note.description,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isSaving) return;

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
          <button className={styles.modalCloseButton} onClick={onClose} disabled={isSaving}>
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
              <button className={styles.editButton} onClick={handleEdit} disabled={isSaving}>
                Edit
              </button>
              <button
                className={styles.deleteButton}
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={isSaving}
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button className={styles.saveButton} onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button className={styles.cancelButton} onClick={handleCancel} disabled={isSaving}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Note?"
        message="This note will be permanently deleted. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          await onDelete();
          setIsDeleteModalOpen(false);
          onClose();
        }}
      />
    </div>
  );
};
