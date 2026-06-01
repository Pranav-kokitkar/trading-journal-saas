import styles from "./addtrade.module.css";
import { useAuth } from "../../../store/Auth";
import { useEffect, useState } from "react";
import { getMaxScreenshots } from "../../../config/planLimits";

export const TradeInfo = ({
  trade,
  handleChange,
  screenshots,
  setScreenshots,
}) => {
  const { isPro, authorizationToken } = useAuth();
  const confidenceValue = trade.tradeConfidence === "" || trade.tradeConfidence == null
    ? null
    : Math.max(0, Math.min(100, Number(trade.tradeConfidence)));
  const confidenceSteps = [
    { value: 20, label: "C" },
    { value: 40, label: "B" },
    { value: 60, label: "B+" },
    { value: 80, label: "A" },
    { value: 100, label: "A+" },
  ];
  const [tags, setTags] = useState([]);
  const [showTags, setShowTags] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfidence, setShowConfidence] = useState(Boolean(confidenceValue !== null));
  const [confidenceDraft, setConfidenceDraft] = useState(50);

  useEffect(() => {
    setShowConfidence(confidenceValue !== null);
  }, [confidenceValue]);

  const uploadLimit = getMaxScreenshots(isPro);

  /* ---------------- FILE HANDLING ---------------- */

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length > uploadLimit) {
      alert(`You can upload a maximum of ${uploadLimit} screenshots.`);
      e.target.value = "";
      return;
    }

    setScreenshots(files);
  };

  const handleRatingChange = (value) => {
    const nextValue = String(value || "").toUpperCase();
    handleChange({
      target: {
        name: "tradeGrade",
        value: nextValue && nextValue === String(trade.tradeGrade || "").toUpperCase() ? "" : nextValue,
      },
    });
  };

  const handleConfidenceChange = (value) => {
    handleChange({
      target: {
        name: "tradeConfidence",
        value: value === "" ? "" : String(value),
      },
    });
  };

  const clearConfidence = () => {
    setShowConfidence(false);
    setConfidenceDraft(50);
    handleConfidenceChange("");
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files || []).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (files.length > uploadLimit) {
      alert(`You can upload a maximum of ${uploadLimit} screenshots.`);
      return;
    }

    if (files.length > 0) {
      setScreenshots(files);
    }
  };

  /* ---------------- FETCH TAGS (ACCOUNT BASED) ---------------- */
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

  /* ---------------- TAG TOGGLE ---------------- */

  const toggleTag = (tagId) => {
    const currentTags = trade.tags || [];

    const updatedTags = currentTags.includes(tagId)
      ? currentTags.filter((id) => id !== tagId)
      : [...currentTags, tagId];

    handleChange({
      target: {
        name: "tags",
        value: updatedTags,
      },
    });
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.sectionHeader}>Trade Context</h3>

      <div className={styles.contextStack}>
        <div className={styles.confidenceGroup}>
          <div className={styles.confidenceHeader}>
            <div className={styles.confidenceLabelGroup}>
              <label htmlFor="tradeGrade">Trade Grade</label>
              <span>Use this to capture the grade setup for the trade.</span>
            </div>
          </div>

          <div className={styles.ratingGroup} role="radiogroup" aria-label="Trade grade rating">
            {confidenceSteps.map((step, index) => {
              const currentGrade = String(trade.tradeGrade || "").trim().toUpperCase();
              const isActive = currentGrade === step.label;
              return (
                <button
                  key={step.label}
                  type="button"
                  className={`${styles.ratingChip} ${isActive ? styles.ratingChipActive : ""}`}
                  onClick={() => handleRatingChange(step.label)}
                  aria-pressed={isActive}
                >
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.confidenceGroup}>
          <div className={styles.confidenceHeader}>
            <div className={styles.confidenceLabelGroup}>
              <label htmlFor="tradeConfidence">Trade Confidence</label>
              <span>Optional. If you do not set it now, you can add it later from Trade Details.</span>
            </div>
            {!showConfidence && confidenceValue === null && (
              <button
                type="button"
                className={styles.addTagToggle}
                onClick={() => setShowConfidence(true)}
              >
                Add Confidence
              </button>
            )}
            {(showConfidence || confidenceValue !== null) && (
              <button
                type="button"
                className={styles.addTagToggleCompact}
                onClick={clearConfidence}
              >
                Clear Confidence
              </button>
            )}
          </div>

          {(showConfidence || confidenceValue !== null) && (
            <div className={styles.confidenceSliderBlock}>
              <div className={styles.confidenceMeta}>
                {confidenceValue === null ? `${confidenceDraft}%` : `${confidenceValue}%`}
              </div>
              <div className={styles.confidenceTrack} style={{ "--confidence": `${confidenceValue ?? confidenceDraft}%` }}>
                <div className={styles.confidenceTrackFill} />
                <input
                  id="tradeConfidence"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={confidenceValue ?? confidenceDraft}
                  onChange={(e) => handleConfidenceChange(e.target.value)}
                  onInput={(e) => setConfidenceDraft(Number(e.target.value))}
                  aria-label="Trade confidence"
                />
              </div>
              <div className={styles.confidenceMarks} aria-hidden>
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>
          )}
        </div>

        <div className={styles.tagsGroup}>
          {!showTags ? (
            <button
              type="button"
              className={styles.addTagToggle}
              onClick={() => setShowTags(true)}
            >
              + Add Tags
            </button>
          ) : (
            <div className={styles.tagDisclosurePanel}>
              <div className={styles.tagDisclosureHeader}>
                <span>
                  {(trade.tags || []).length > 0
                    ? `${(trade.tags || []).length} selected`
                    : "Pick one or more tags"}
                </span>
                <button
                  type="button"
                  className={styles.addTagToggleCompact}
                  onClick={() => setShowTags(false)}
                >
                  Hide Tags
                </button>
              </div>
              <div className={styles.tagPicker}>
                {tags.length === 0 ? (
                  <p className={styles.noTagsText}>
                    No tags available. Create tags in the Tags page.
                  </p>
                ) : (
                  tags.map((t) => {
                    const isSelected = (trade.tags || []).includes(t._id);

                    return (
                      <button
                        key={t._id}
                        type="button"
                        onClick={() => toggleTag(t._id)}
                        className={`${styles.tagPill} ${isSelected ? styles.tagPillSelected : styles.tagPillUnselected}`}
                      >
                        {t.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.sectionSpacing}>
        <label className={styles.uploadZone} onDragOver={(e) => e.preventDefault()} onDragEnter={() => setIsDragging(true)} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}>
          <span className={styles.uploadSectionLabel}>Screenshot Upload</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className={styles.hiddenFileInput}
          />
          <div className={`${styles.uploadZoneInner} ${isDragging ? styles.uploadZoneActive : ""}`}>
            <div className={styles.uploadIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4" />
                <path d="m8 8 4-4 4 4" />
                <path d="M20 16.5a4.5 4.5 0 0 0-4.5-4.5H14a6 6 0 1 0-10 4.2" />
                <path d="M7 16.5V17" />
                <path d="M12 20h.01" />
              </svg>
            </div>
            <div className={styles.uploadCopy}>
              <p className={styles.uploadPrimaryText}>
                Drag &amp; drop your screenshots here, or <span className={styles.uploadBrowseText}>click to browse</span>
              </p>
              <p className={styles.uploadSecondaryText}>Max 2 images. Supports PNG, JPG.</p>
            </div>
          </div>
        </label>
        {screenshots && screenshots.length > 0 && (
          <small className={styles.uploadCount}>
            {screenshots.length}/{uploadLimit} selected
          </small>
        )}
      </div>

      <div className={`${styles.textareaGroup} ${styles.sectionSpacing}`}>
        <label htmlFor="tradeNotes">Trade Notes</label>
        <textarea
          id="tradeNotes"
          name="tradeNotes"
          value={trade.tradeNotes}
          onChange={handleChange}
          placeholder="Add your trade analysis, strategy or any additional notes..."
        />
      </div>
    </div>
  );
};
