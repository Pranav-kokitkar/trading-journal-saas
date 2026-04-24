import React, { useState, useContext } from "react";
import { useAuth } from "../../../store/Auth";
import { AccountContext } from "../../../context/AccountContext";
import toast from "react-hot-toast";
import styles from "./Compare.module.css";

import { DimensionSelector } from "./DimensionSelector";
import { DimensionInputs } from "./DimensionInputs";
import { DatasetCard } from "./DatasetCard";
import { ComparisonCharts } from "./ComparisonCharts";
import { useCompareData } from "./useCompareData";
import { compareDatasets } from "./compareApi";
import { getMaxCompareDimensions } from "../../../config/planLimits";
import {
  formatMetricValue,
  mergeEquityCurveData,
  mergeExpectancyData,
  getDimensionLabel,
} from "./utils";
import { SkeletonCard, SkeletonInput, SkeletonText } from "../../ui/skeleton/Skeleton";

const AVAILABLE_DIMENSIONS = [
  { key: "accountId", label: "Account", type: "select" },
  { key: "strategy", label: "Strategy", type: "select" },
  { key: "symbol", label: "Symbol", type: "text" },
  { key: "direction", label: "Direction", type: "select" },
  { key: "tag", label: "Tag", type: "select" },
  { key: "marketType", label: "Market Type", type: "select" },
  { key: "tradeStatus", label: "Trade Status", type: "select" },
];

const DIRECTION_OPTIONS = ["long", "short"];
const STATUS_OPTIONS = ["live", "exited"];
const MARKET_TYPE_OPTIONS = ["forex", "crypto", "stocks"];

export const Compare = () => {
  const { authorizationToken, isPro } = useAuth();
  const { accountDetails } = useContext(AccountContext);
  const { accounts, strategies, tags, loadingData } = useCompareData(authorizationToken);
  const maxCompareDimensions = getMaxCompareDimensions(isPro);

  const [selectedDimensions, setSelectedDimensions] = useState([]);
  const [dimensionValues, setDimensionValues] = useState({});
  const [comparisonResults, setComparisonResults] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [includeImported, setIncludeImported] = useState(true);

  /* -------------------- TOGGLE DIMENSION -------------------- */
  const toggleDimension = (dimensionKey) => {
    if (selectedDimensions.includes(dimensionKey)) {
      setSelectedDimensions(selectedDimensions.filter((d) => d !== dimensionKey));
      const newValues = { ...dimensionValues };
      delete newValues[dimensionKey];
      setDimensionValues(newValues);
    } else {
      if (selectedDimensions.length >= maxCompareDimensions) {
        toast.error(
          isPro
            ? `You can compare up to ${maxCompareDimensions} dimensions.`
            : "Buy Pro to add more comparison dimensions."
        );
        return;
      }

      let newDimensions;
      let newValues = { ...dimensionValues };

      if (dimensionKey === "accountId") {
        newDimensions = ["accountId", ...selectedDimensions];

        if (dimensionValues.strategy) {
          newValues.strategy = { A: "", B: "" };
        }
        if (dimensionValues.tag) {
          newValues.tag = { A: "", B: "" };
        }
      } else {
        newDimensions = [...selectedDimensions, dimensionKey];
      }

      setSelectedDimensions(newDimensions);
      newValues[dimensionKey] = { A: "", B: "" };
      setDimensionValues(newValues);
    }
  };

  /* -------------------- HANDLE INPUT CHANGE -------------------- */
  const handleInputChange = (dimensionKey, dataset, value) => {
    const newValues = {
      ...dimensionValues,
      [dimensionKey]: {
        ...dimensionValues[dimensionKey],
        [dataset]: value,
      },
    };

    if (dimensionKey === "accountId") {
      if (dimensionValues.strategy && dimensionValues.strategy[dataset]) {
        newValues.strategy = {
          ...dimensionValues.strategy,
          [dataset]: "",
        };
      }
      if (dimensionValues.tag && dimensionValues.tag[dataset]) {
        newValues.tag = {
          ...dimensionValues.tag,
          [dataset]: "",
        };
      }
    }

    setDimensionValues(newValues);
  };

  /* -------------------- REMOVE DIMENSION -------------------- */
  const removeDimension = (dimensionKey) => {
    setSelectedDimensions(selectedDimensions.filter((d) => d !== dimensionKey));
    const newValues = { ...dimensionValues };
    delete newValues[dimensionKey];
    setDimensionValues(newValues);
  };

  /* -------------------- GET FILTERED DATA -------------------- */
  const getFilteredStrategies = (dataset) => {
    const accountIdDimension = selectedDimensions.includes("accountId");

    if (!accountIdDimension) {
      if (!accountDetails?._id) return [];
      return strategies.filter((strat) => strat.accountId === accountDetails._id);
    }

    const selectedAccountId = dimensionValues.accountId?.[dataset];
    if (!selectedAccountId) return strategies;

    return strategies.filter((strat) => strat.accountId === selectedAccountId);
  };

  const getFilteredTags = (dataset) => {
    const accountIdDimension = selectedDimensions.includes("accountId");

    if (!accountIdDimension) {
      if (!accountDetails?._id) return [];
      return tags.filter((tag) => tag.accountId === accountDetails._id);
    }

    const selectedAccountId = dimensionValues.accountId?.[dataset];
    if (!selectedAccountId) return tags;

    return tags.filter((tag) => tag.accountId === selectedAccountId);
  };

  /* -------------------- RENDER INPUT FIELD -------------------- */
  const renderInputField = (dimension, dataset) => {
    const value = dimensionValues[dimension.key]?.[dataset] || "";

    switch (dimension.key) {
      case "accountId":
        return (
          <select
            value={value}
            onChange={(e) =>
              handleInputChange(dimension.key, dataset, e.target.value)
            }
          >
            <option value="">Select Account</option>
            {accounts.map((acc) => (
              <option key={acc._id} value={acc._id}>
                {acc.name}
              </option>
            ))}
          </select>
        );

      case "strategy":
        const filteredStrategies = getFilteredStrategies(dataset);
        return (
          <select
            value={value}
            onChange={(e) =>
              handleInputChange(dimension.key, dataset, e.target.value)
            }
          >
            <option value="">Select Strategy</option>
            {filteredStrategies.length === 0 ? (
              <option disabled>No strategies available</option>
            ) : (
              filteredStrategies.map((strat) => (
                <option key={strat._id} value={strat._id}>
                  {strat.name}
                </option>
              ))
            )}
          </select>
        );

      case "tag":
        const filteredTags = getFilteredTags(dataset);
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(dimension.key, dataset, e.target.value)}
          >
            <option value="">Select Tag</option>
            {filteredTags.length === 0 ? (
              <option disabled>No tags available</option>
            ) : (
              filteredTags.map((tag) => (
                <option key={tag._id} value={tag._id}>
                  {tag.name}
                </option>
              ))
            )}
          </select>
        );

      case "direction":
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(dimension.key, dataset, e.target.value)}
          >
            <option value="">Select Direction</option>
            {DIRECTION_OPTIONS.map((dir) => (
              <option key={dir} value={dir}>
                {dir.toUpperCase()}
              </option>
            ))}
          </select>
        );

      case "tradeStatus":
        const getStatusLabel = (status) => {
          if (status === "live") return "Live (Ongoing)";
          if (status === "exited") return "Exited (Completed)";
          return status;
        };
        
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(dimension.key, dataset, e.target.value)}
          >
            <option value="">Select Status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </select>
        );

      case "marketType":
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(dimension.key, dataset, e.target.value)}
          >
            <option value="">Select Market Type</option>
            {MARKET_TYPE_OPTIONS.map((market) => (
              <option key={market} value={market}>
                {market.charAt(0).toUpperCase() + market.slice(1)}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(dimension.key, dataset, e.target.value)}
            placeholder={`Enter ${dimension.label}`}
          />
        );
    }
  };

  /* -------------------- HANDLE INCLUDE IMPORTED CHANGE -------------------- */
  const handleIncludeImportedChange = async (e) => {
    const newValue = e.target.checked;
    setIncludeImported(newValue);

    // If there are existing comparison results, reload with new includeImported value
    if (comparisonResults && isCompareEnabled()) {
      setIsComparing(true);
      try {
        const dimensions = {};

        selectedDimensions.forEach((dimKey) => {
          const values = dimensionValues[dimKey];
          if (values && (values.A || values.B)) {
            dimensions[dimKey] = {
              A: values.A || "",
              B: values.B || "",
            };
          }
        });

        const payload = {
          dimensions,
          includeImported: newValue,
        };

        // Add currentAccountId if accountId dimension is not selected
        if (!dimensions.accountId && accountDetails?._id) {
          payload.currentAccountId = accountDetails._id;
        }

        const response = await fetch(`${(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))}/api/compare`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authorizationToken,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
          setComparisonResults(data.comparison);
          toast.success("Comparison updated successfully");
        } else {
          toast.error(data.message || "Failed to update comparison");
        }
      } catch (error) {
        console.error("Error updating comparison:", error);
        toast.error("Error updating comparison");
      } finally {
        setIsComparing(false);
      }
    }
  };

  /* -------------------- HANDLE COMPARE -------------------- */
  const handleCompare = async () => {
    // Build dimensions object for API call
    const dimensions = {};

    selectedDimensions.forEach((dimKey) => {
      const values = dimensionValues[dimKey];
      if (values && (values.A || values.B)) {
        dimensions[dimKey] = {
          A: values.A || "",
          B: values.B || "",
        };
      }
    });

    // Validate we have at least one dimension with values
    if (Object.keys(dimensions).length === 0) {
      toast.error("Please select at least one dimension with values");
      return;
    }

    setIsComparing(true);
    try {
      const payload = {
        dimensions,
        includeImported,
      };

      // Add currentAccountId if accountId dimension is not selected
      if (!dimensions.accountId && accountDetails?._id) {
        payload.currentAccountId = accountDetails._id;
      }

      const response = await fetch(`${(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))}/api/compare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authorizationToken,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setComparisonResults(data.comparison);
        toast.success("Comparison completed successfully");
      } else {
        toast.error(data.message || "Failed to compare datasets");
        console.error("Compare error:", data);
      }
    } catch (error) {
      console.error("Error comparing datasets:", error);
      toast.error("Error comparing datasets");
    } finally {
      setIsComparing(false);
    }
  };

  /* -------------------- CHECK IF COMPARE IS ENABLED -------------------- */
  const isCompareEnabled = () => {
    if (selectedDimensions.length === 0) return false;

    // At least one dimension must have A or B value
    return selectedDimensions.some((dim) => {
      const values = dimensionValues[dim];
      return values && (values.A || values.B);
    });
  };

  /* -------------------- GET SELECTED DIMENSIONS TEXT -------------------- */
  const getSelectedDimensionsText = (dataset) => {
    const selected = selectedDimensions
      .map((dimKey) => {
        const dimension = AVAILABLE_DIMENSIONS.find((d) => d.key === dimKey);
        const value = dimensionValues[dimKey]?.[dataset];
        if (value) {
          return `${dimension.label}: ${getDimensionLabel(
            dimKey,
            value,
            accounts,
            strategies,
            tags
          )}`;
        }
        return null;
      })
      .filter(Boolean);

    return selected.length > 0 ? selected.join(" • ") : "No filters applied";
  };

  return (
    <div className={`${styles.comparePage} app-page`}>
      <div className={styles.mainContent}>
        {/* Page Heading */}
        <div className={`${styles.heading} app-page-heading`}>
          <h2 className="app-page-title">Compare <span>Datasets</span></h2>
          <p className="app-page-subtitle">
            Select dimensions to compare two different datasets of your trades and analyze
            performance differences
          </p>
        </div>

        {/* Loading State */}
        {loadingData ? (
          <div className={styles.loadingState}>
            <SkeletonText lines={1} width="160px" />
            <div className={styles.compareLoadingCards}>
              <SkeletonCard rows={3} withHeader />
              <SkeletonCard rows={3} withHeader />
            </div>
          </div>
        ) : (
          <>
            {/* Compare Form */}
            <div className={styles.compareForm}>
              <h3>Select Comparison Dimensions</h3>

              <DimensionSelector
                dimensions={AVAILABLE_DIMENSIONS}
                selectedDimensions={selectedDimensions}
                onToggleDimension={toggleDimension}
              />

              <DimensionInputs
                selectedDimensions={selectedDimensions}
                dimensionValues={dimensionValues}
                availableDimensions={AVAILABLE_DIMENSIONS}
                renderInputField={renderInputField}
                onRemoveDimension={removeDimension}
              />

          {/* Compare Button */}
          <button
            className={styles.compareBtn}
            onClick={handleCompare}
            disabled={!isCompareEnabled() || isComparing}
          >
            {isComparing ? (
              <SkeletonInput className={styles.compareButtonSkeleton} height={14} />
            ) : (
              "Compare Datasets"
            )}
          </button>

          <label className={styles.importedTradesLabel}>
            <input
              type="checkbox"
              checked={includeImported}
              onChange={handleIncludeImportedChange}
            />{" "}
            Include Imported Trades
          </label>
        </div>

            {/* Results Section */}
            {comparisonResults && (
              <div className={styles.resultsSection}>
                <h3>Comparison Results</h3>

                <>
                  <div className={styles.resultsGrid}>
                    <DatasetCard
                      dataset="A"
                      stats={comparisonResults.datasetA.stats}
                      sampleSize={comparisonResults.datasetA.sampleSize}
                      dimensionsText={getSelectedDimensionsText("A")}
                      formatMetricValue={formatMetricValue}
                    />

                    <DatasetCard
                      dataset="B"
                      stats={comparisonResults.datasetB.stats}
                      sampleSize={comparisonResults.datasetB.sampleSize}
                      dimensionsText={getSelectedDimensionsText("B")}
                      formatMetricValue={formatMetricValue}
                    />
                  </div>

                  <ComparisonCharts
                    equityCurveData={mergeEquityCurveData(
                      comparisonResults.datasetA,
                      comparisonResults.datasetB
                    )}
                    expectancyData={mergeExpectancyData(
                      comparisonResults.datasetA,
                      comparisonResults.datasetB
                    )}
                  />
                </>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
