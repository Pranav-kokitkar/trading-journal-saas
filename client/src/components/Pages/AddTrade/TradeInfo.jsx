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
  const confidenceValue = Math.max(
    0,
    Math.min(100, Number(trade.confidence ?? 50)),
  );

  const [tags, setTags] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [showTagPicker, setShowTagPicker] = useState(false);

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

  /* ---------------- FETCH STRATEGIES (ACCOUNT BASED) ---------------- */
  const getAllStrategies = async () => {
    try {
      const response = await fetch(
        `${(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))}/api/strategy`,
        {
          headers: {
            Authorization: authorizationToken,
          },
        }
      );

      const data = await response.json();
      if (response.ok) setStrategies(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getAllTags();
    getAllStrategies();
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
      <h3>Additional Info</h3>

      {/* ---------------- STRATEGY SECTION ---------------- */}

      <div className={styles.sectionSpacing}>
        <div className={styles.inputGroup}>
          <label htmlFor="strategy">Strategy (Optional)</label>
          <select
            id="strategy"
            name="strategy"
            value={trade.strategy || ""}
            onChange={handleChange}
          >
            <option value="">-- Select Strategy --</option>
            {strategies.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
          {strategies.length === 0 && (
            <small className={styles.helperText}>
              No strategies available. Create one in Trade Setups page.
            </small>
          )}
        </div>
      </div>

      {/* ---------------- TAG SECTION ---------------- */}

      <div className={styles.sectionSpacing}>
        <button
          type="button"
          className={styles.addTagBtn}
          onClick={() => setShowTagPicker((prev) => !prev)}
        >
          {showTagPicker ? "− Hide Tags" : "+ Add Tags"}
        </button>

        {showTagPicker && (
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
                    className={
                      isSelected ? styles.tagSelected : styles.tagUnselected
                    }
                    style={{
                      backgroundColor: isSelected ? t.colour : "transparent",
                      color: isSelected ? "#fff" : t.colour,
                      borderColor: t.colour,
                    }}
                  >
                    {t.name}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ---------------- SESSION (DROPDOWN) ---------------- */}

      <div className={styles.sectionSpacing}>
        <div className={styles.inputGroup}>
          <label htmlFor="session">Trading Session (Optional)</label>
          <select
            id="session"
            name="session"
            value={trade.session || ""}
            onChange={handleChange}
          >
            <option value="">-- Select Session --</option>
            <option value="london">London</option>
            <option value="newyork">New York</option>
            <option value="asia">Asian</option>
            <option value="sydney">Sydney</option>
            <option value="tokyo">Tokyo</option>
            <option value="european">European</option>
          </select>
        </div>
      </div>

      {/* ---------------- CONFIDENCE ---------------- */}

      <div className={styles.sectionSpacing}>
        <div
          className={styles.confidenceGroup}
          style={{ "--confidence": `${confidenceValue}%` }}
        >
          <div className={styles.confidenceHeader}>
            <div className={styles.confidenceLabelGroup}>
              <label htmlFor="confidence">Confidence</label>
              <span>How sure are you?</span>
            </div>
            <span className={styles.confidenceMeta}>{confidenceValue}%</span>
          </div>
          <div className={styles.confidenceTrack}>
            <div className={styles.confidenceTrackFill} />
            <input
              id="confidence"
              name="confidence"
              type="range"
              min="0"
              max="100"
              step="1"
              value={trade.confidence ?? 50}
              onChange={handleChange}
              aria-valuenow={confidenceValue}
              aria-valuetext={`${confidenceValue}% confidence`}
            />
          </div>
          <div className={styles.confidenceMarks} aria-hidden="true">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </div>
      </div>

      {/* ---------------- SCREENSHOTS ---------------- */}

      <div className={`${styles.col2} ${styles.sectionSpacing}`}>
        <div>
          <label>Upload Screenshot (max {uploadLimit})</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
          {screenshots && screenshots.length > 0 && (
            <small>
              {screenshots.length}/{uploadLimit} selected
            </small>
          )}
        </div>
      </div>

      {/* ---------------- NOTES ---------------- */}

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
