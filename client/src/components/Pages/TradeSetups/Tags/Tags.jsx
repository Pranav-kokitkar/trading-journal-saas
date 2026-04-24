import React, { useEffect, useState } from "react";
import { useAuth } from "../../../../store/Auth";
import toast from "react-hot-toast";
import { ConfirmationModal } from "../../../modals/ConfirmationModal/ConfirmationModal";
import styles from "./Tags.module.css";
import { getMaxTags } from "../../../../config/planLimits";

export const Tags = () => {
  const TAG_COLORS = [
    "#6e7cff", // Accent Blue
    "#3dd6a6", // Success Green
    "#ff7f87", // Soft Red
    "#59a8ff", // Blue
    "#a78bfa", // Violet
    "#f59e0b", // Amber
    "#2dd4bf", // Teal
    "#8da7ff", // Light Blue
  ];

  const [tag, setTag] = useState({ name: "", colour: "" });
  const [tags, setTags] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTagUpdateModalOpen, setIsTagUpdateModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);
  const [tagToUpdate, setTagToUpdate] = useState(null);

  const { authorizationToken, isPro } = useAuth();

  /* -------------------- CREATE TAG -------------------- */

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTag((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (actionLoading) return;

    if (!tag.name.trim() || !tag.colour) {
      toast.error("Tag name and colour are required");
      return;
    }

    // Check tag limit before sending request
    const maxTags = getMaxTags(isPro);
    if (tags.length >= maxTags) {
      toast.error(
        isPro
          ? `Pro plan tag limit (${maxTags}) reached`
          : `Free plan tag limit (${maxTags}) reached. Upgrade to Pro.`
      );
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`${(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))}/api/tags`, {
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
    } finally {
      setActionLoading(false);
    }
  };

  /* -------------------- FETCH TAGS -------------------- */

  const getAllTags = async () => {
    try {
      const response = await fetch(`${(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))}/api/tags`, {
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
    if (actionLoading) return;

    try {
      setActionLoading(true);
      const response = await fetch(
        `${(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))}/api/tags/${tagToDelete}`,
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
      setActionLoading(false);
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
    if (actionLoading) return;

    try {
      setActionLoading(true);
      const response = await fetch(
        `${(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))}/api/tags/${tagToUpdate._id}`,
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
    } finally {
      setActionLoading(false);
    }
  };

  /* -------------------- UI -------------------- */

  return (
    <div className={`${styles.tagsPage} app-page`}>
      <div className={styles.mainContent}>
        {/* Page Heading */}
        <div className={styles.heading}>
          <h2>Manage Tags</h2>
          <p>Label trades to identify patterns, mistakes, and improvements</p>
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

          <button type="submit" className={styles.submitBtn} disabled={actionLoading}>
            {actionLoading ? "Saving..." : "Create Tag"}
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
                      disabled={actionLoading}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(t._id)}
                      className={styles.deleteBtn}
                      disabled={actionLoading}
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
          loading={actionLoading}
          onCancel={() => {
            setIsTagUpdateModalOpen(false);
            setTagToUpdate(null);
            setTag({ name: "", colour: "" });
          }}
          onConfirm={confirmUpdate}
        />
      )}
    </div>
  );
};

/* -------------------- TAG UPDATE MODAL -------------------- */

const TagUpdateModal = ({ tag, setTag, TAG_COLORS, loading, onCancel, onConfirm }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTag((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Update Tag</h3>

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
          <button className={styles.cancelBtn} onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};
