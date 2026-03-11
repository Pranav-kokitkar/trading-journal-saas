import React from "react";
import styles from "./Compare.module.css";

export const DimensionSelector = ({ 
  dimensions, 
  selectedDimensions, 
  onToggleDimension 
}) => {
  return (
    <div className={styles.dimensionSelection}>
      <h4>Available Dimensions</h4>
      <div className={styles.dimensionGrid}>
        {dimensions.map((dimension) => (
          <div
            key={dimension.key}
            className={`${styles.dimensionCheckbox} ${
              selectedDimensions.includes(dimension.key) ? styles.active : ""
            }`}
          >
            <input
              type="checkbox"
              id={dimension.key}
              checked={selectedDimensions.includes(dimension.key)}
              onChange={() => onToggleDimension(dimension.key)}
            />
            <label htmlFor={dimension.key}>{dimension.label}</label>
          </div>
        ))}
      </div>
    </div>
  );
};
