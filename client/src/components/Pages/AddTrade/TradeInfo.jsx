import styles from "./addtrade.module.css";
import { useAuth } from "../../../store/Auth";
import { useEffect, useState } from "react";

export const TradeInfo = ({
  trade,
  handleChange,
  screenshots,
  setScreenshots,
}) => {
  const { isPro, authorizationToken } = useAuth();

  const [tags, setTags] = useState([]);
  const [showTagPicker, setShowTagPicker] = useState(false);

  const uploadLimit = isPro ? 3 : 1;

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

      {/* ---------------- TAG SECTION ---------------- */}

      <div>
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

      {/* ---------------- SCREENSHOTS ---------------- */}

      <div className={styles.col2}>
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

      <div className={styles.textareaGroup}>
        <label htmlFor="tradeNotes">Notes and Description</label>
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
