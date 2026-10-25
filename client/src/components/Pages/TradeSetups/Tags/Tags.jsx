import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../store/Auth";
import { useTrades } from "../../../../store/TradeContext";
import toast from "react-hot-toast";
import { ConfirmationModal } from "../../../modals/ConfirmationModal/ConfirmationModal";
import styles from "./Tags.module.css";
import { getMaxTags } from "../../../../config/planLimits";

export const Tags = ({ showHeading = true }) => {
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
  const navigate = useNavigate();
  const { accountTrades = [] } = useTrades() || {};

  const tagUsage = useMemo(() => {
    const usageById = new Map();
    const usageByName = new Map();

    (Array.isArray(accountTrades) ? accountTrades : []).forEach((trade) => {
      (Array.isArray(trade?.tags) ? trade.tags : []).forEach((tradeTag) => {
        const id = String(tradeTag?._id || tradeTag?.id || tradeTag || "");
        const name = String(tradeTag?.name || "").trim().toLowerCase();
        if (id) usageById.set(id, (usageById.get(id) || 0) + 1);
        if (name) usageByName.set(name, (usageByName.get(name) || 0) + 1);
      });
    });

    return tags
      .map((currentTag) => ({
        ...currentTag,
        usageCount:
          usageById.get(String(currentTag._id)) ||
          usageByName.get(String(currentTag.name || "").trim().toLowerCase()) ||
          0,
      }))
      .sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name));
  }, [accountTrades, tags]);

  const totalApplications = tagUsage.reduce(
    (total, currentTag) => total + currentTag.usageCount,
    0,
  );
  const usedTags = tagUsage.filter((currentTag) => currentTag.usageCount > 0);
  const mostUsedTags = usedTags.slice(0, 5);
  const mostUsedTagIds = new Set(mostUsedTags.map((currentTag) => currentTag._id));
  const otherTags = tagUsage.filter((currentTag) => !mostUsedTagIds.has(currentTag._id));
  const chartTags = mostUsedTags.length > 0 ? mostUsedTags : tagUsage.slice(0, 5);
  const chartTotal = chartTags.reduce(
    (total, currentTag) => total + currentTag.usageCount,
    0,
  );
  const chartGap = 3;
  let chartOffset = 0;
  const chartGradient = chartTotal > 0
    ? `conic-gradient(transparent 0deg ${chartGap}deg, ${chartTags.map((currentTag) => {
        const usableDegrees = 360 - chartTags.length * chartGap;
        const sliceDegrees = (currentTag.usageCount / chartTotal) * usableDegrees;
        const start = chartOffset + chartGap;
        const end = start + sliceDegrees;
        chartOffset = end;
        return `${currentTag.colour || "#c9a743"} ${start}deg ${end}deg, transparent ${end}deg ${end + chartGap}deg`;
      }).join(", ")})`
    : "conic-gradient(#3a3424 0deg 360deg)";

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
      <div className={styles.tagsLayout}>
      <div className={styles.mainContent}>
        {/* Page Heading */}
        {showHeading && (
          <div className={styles.heading}>
            <h2>Manage Tags</h2>
            <p>Label trades to identify patterns, mistakes, and improvements</p>
          </div>
        )}

        {/* Create Tag Form */}
        <form className={styles.createForm} onSubmit={handleSubmit}>
          <h3>Create New Tag</h3>
          {!isPro && tags.length >= getMaxTags(false) && (
            <div role="alert">
              Free accounts can create up to {getMaxTags(false)} tags.
              <button type="button" onClick={() => navigate("/app/upgrade")}>
                Upgrade to Pro
              </button>
            </div>
          )}

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

      <aside className={styles.usagePanel}>
        <div className={styles.usageEyebrow}>TAG USE</div>
        <h3>Most Used Tags</h3>
        <p className={styles.usageSummary}>
          {totalApplications} total applications across logged trades
        </p>

        <div className={styles.usageChart}>
          <div className={styles.usageDonut} style={{ "--usage-gradient": chartGradient }}>
            <div className={styles.usageDonutCenter}>
              <span>TAG USE</span>
              <strong>{totalApplications}</strong>
              <small>TOP 5</small>
            </div>
          </div>
        </div>

        <div className={styles.usageList}>
          {mostUsedTags.length === 0 ? (
            <p className={styles.usageEmpty}>Tags will appear here as trades are logged.</p>
          ) : (
            mostUsedTags.map((currentTag) => {
              const percentage = totalApplications > 0
                ? Math.round((currentTag.usageCount / totalApplications) * 100)
                : 0;
              return (
                <div className={styles.usageRow} key={currentTag._id}>
                  <div className={styles.usageRowHeader}>
                    <span className={styles.usageTagName}>
                      <i style={{ backgroundColor: currentTag.colour || "#c9a743" }} />
                      {currentTag.name}
                    </span>
                    <span className={styles.usageCount}>
                      {currentTag.usageCount} <b>{percentage}%</b>
                    </span>
                  </div>
                  <div className={styles.usageBar}>
                    <span
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: currentTag.colour || "#c9a743",
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {otherTags.length > 0 && (
          <div className={styles.otherTags}>
            <h4>Other Tags</h4>
            <div className={styles.otherTagsList}>
              {otherTags.map((currentTag) => (
                <span key={currentTag._id}>
                  <i style={{ backgroundColor: currentTag.colour || "#c9a743" }} />
                  {currentTag.name} ({currentTag.usageCount})
                </span>
              ))}
            </div>
          </div>
        )}
      </aside>
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
