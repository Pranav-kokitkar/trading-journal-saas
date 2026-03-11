import React from "react";
import styles from "./Compare.module.css";

export const DimensionInputs = ({
  selectedDimensions,
  dimensionValues,
  availableDimensions,
  renderInputField,
  onRemoveDimension,
}) => {
  if (selectedDimensions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No dimensions selected. Please select at least one dimension above.</p>
      </div>
    );
  }

  return (
    <div className={styles.dimensionInputs}>
      {selectedDimensions.map((dimKey) => {
        const dimension = availableDimensions.find((d) => d.key === dimKey);
        if (!dimension) return null;

        return (
          <div key={dimKey} className={styles.dimensionRow}>
            <div className={styles.dimensionHeader}>
              <span className={styles.dimensionTitle}>{dimension.label}</span>
              <button
                className={styles.removeBtn}
                onClick={() => onRemoveDimension(dimKey)}
              >
                Remove
              </button>
            </div>

            <div className={styles.abInputGrid}>
              {/* Dataset A */}
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  <span className={styles.datasetBadge}>A</span>
                  Dataset A
                </label>
                {renderInputField(dimension, "A")}
              </div>

              {/* Dataset B */}
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  <span className={styles.datasetBadge}>B</span>
                  Dataset B
                </label>
                {renderInputField(dimension, "B")}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
