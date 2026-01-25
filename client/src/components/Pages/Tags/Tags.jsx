import React, { useEffect, useState } from "react";
import { useAuth } from "../../../store/Auth";
import toast from "react-hot-toast";
import { ConfirmationModal } from "../../modals/ConfirmationModal/ConfirmationModal";
import styles from "./Tags.module.css";

export const Tags = () => {
  const TAG_COLORS = [
    "#f6b93b", // Accent Golden
    "#22c55e", // Success Green
    "#ef4444", // Error Red
    "#3b82f6", // Blue
    "#a855f7", // Purple
    "#f97316", // Orange
    "#14b8a6", // Teal
    "#64a0ff", // Light Blue
  ];

  const [tag, setTag] = useState({ name: "", colour: "" });
  const [tags, setTags] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTagUpdateModalOpen, setIsTagUpdateModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);
  const [tagToUpdate, setTagToUpdate] = useState(null);

  const { authorizationToken } = useAuth();

  /* -------------------- CREATE TAG -------------------- */

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTag((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tag.name.trim() || !tag.colour) {
      toast.error("Tag name and colour are required");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authorizationToken,
        },
        body: JSON.stringify(tag),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Tag created");
        setTag({ name: "", colour: "" });
        getAllTags();
      } else {
        toast.error(data.message || "Failed to create tag");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server error");
    }
  };

  /* -------------------- FETCH TAGS -------------------- */

  const getAllTags = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tags`, {
        headers: {
          Authorization: authorizationToken,
        },
      });

      const data = await response.json();
      if (response.ok) setTags(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getAllTags();
  }, []);

  /* -------------------- DELETE TAG -------------------- */

  const openDeleteModal = (id) => {
    setTagToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!tagToDelete) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tags/${tagToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: authorizationToken,
          },
        },
      );

      if (response.ok) {
        toast.success("Tag deleted");
        getAllTags();
      } else {
        toast.error("Failed to delete tag");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server error");
    } finally {
      setIsDeleteModalOpen(false);
      setTagToDelete(null);
    }
  };

  /* -------------------- UPDATE TAG -------------------- */

  const openUpdateModal = (t) => {
    setTagToUpdate(t);
    setTag({ name: t.name, colour: t.colour });
    setIsTagUpdateModalOpen(true);
  };

  const confirmUpdate = async () => {
    if (!tagToUpdate) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tags/${tagToUpdate._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: authorizationToken,
          },
          body: JSON.stringify({ name: tag.name, colour: tag.colour }),
        },
      );

      if (response.ok) {
        toast.success("Tag updated");
        setTag({ name: "", colour: "" });
        setIsTagUpdateModalOpen(false);
        setTagToUpdate(null);
        getAllTags();
      } else {
        toast.error("Failed to update tag");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server error");
    }
  };

  /* -------------------- UI -------------------- */

  return (
    <section className={styles.tagsPage}>
      <div className={styles.mainContent}>
        {/* Page Heading */}
        <div className={styles.heading}>
          <h2>Manage Tags</h2>
          <p>Create and organize tags to categorize your trades</p>
        </div>

        {/* Create Tag Form */}
        <form className={styles.createForm} onSubmit={handleSubmit}>
          <h3>Create New Tag</h3>

          <div className={styles.formGroup}>
            <label>Tag Name</label>
            <input
              type="text"
              name="name"
              value={tag.name}
              onChange={handleChange}
              placeholder="Enter tag name..."
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Choose Colour</label>
            <div className={styles.colorGrid}>
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setTag({ ...tag, colour: color })}
                  className={`${styles.colorButton} ${
                    tag.colour === color ? styles.selected : ""
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          <button type="submit" className={styles.submitBtn}>
            Create Tag
          </button>
        </form>

        {/* Tags List */}
        <div className={styles.tagsSection}>
          <h3>Your Tags</h3>

          {tags.length === 0 ? (
            <p className={styles.noTags}>
              No tags yet. Create your first tag above!
            </p>
          ) : (
            <div className={styles.tagsList}>
              {tags.map((t) => (
                <div key={t._id} className={styles.tagCard}>
                  <div className={styles.tagInfo}>
                    <div
                      className={styles.colorDot}
                      style={{ backgroundColor: t.colour }}
                    />
                    <span className={styles.tagName}>{t.name}</span>
                  </div>

                  <div className={styles.tagActions}>
                    <button
                      onClick={() => openUpdateModal(t)}
                      className={styles.editBtn}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(t._id)}
                      className={styles.deleteBtn}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Delete */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Tag?"
        message="This tag will be permanently deleted and removed from all trades where it's used. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setTagToDelete(null);
        }}
        onConfirm={confirmDelete}
      />

      {/* Update Tag Modal */}
      {isTagUpdateModalOpen && (
        <TagUpdateModal
          tag={tag}
          setTag={setTag}
          TAG_COLORS={TAG_COLORS}
          onCancel={() => {
            setIsTagUpdateModalOpen(false);
            setTagToUpdate(null);
            setTag({ name: "", colour: "" });
          }}
          onConfirm={confirmUpdate}
        />
      )}
    </section>
  );
};

/* -------------------- TAG UPDATE MODAL -------------------- */

const TagUpdateModal = ({ tag, setTag, TAG_COLORS, onCancel, onConfirm }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTag((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h4>Update Tag</h4>

        <div className={styles.formGroup}>
          <label>Tag Name</label>
          <input
            type="text"
            name="name"
            value={tag.name}
            onChange={handleChange}
            placeholder="Enter tag name..."
          />
        </div>

        <div className={styles.formGroup}>
          <label>Choose Colour</label>
          <div className={styles.colorGrid}>
            {TAG_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setTag({ ...tag, colour: color })}
                className={`${styles.colorButton} ${
                  tag.colour === color ? styles.selected : ""
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
