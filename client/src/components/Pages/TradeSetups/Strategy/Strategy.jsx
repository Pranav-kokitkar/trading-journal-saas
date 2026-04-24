import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../../../store/Auth";
import { ConfirmationModal } from "../../../modals/ConfirmationModal/ConfirmationModal";
import styles from "./Strategy.module.css";
import { getMaxStrategies } from "../../../../config/planLimits";
import { SkeletonCard, SkeletonText } from "../../../ui/skeleton/Skeleton";

export const Strategy = () => {
  const { authorizationToken, isPro } = useAuth();

  const [strategy, setStrategy] = useState({
    name: "",
    description: "",
  });

  const [strategies, setStrategies] = useState([]);
  const [strategyStats, setStrategyStats] = useState({});
  const [loadingStrategies, setLoadingStrategies] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [strategyToDelete, setStrategyToDelete] = useState(null);
  const [strategyToUpdate, setStrategyToUpdate] = useState(null);

  const normalizeName = (value) => String(value || "").trim().toLowerCase();

  const formatWinRate = (value) => `${Number(value || 0).toFixed(1)}%`;
  const formatExpectancy = (value) => `${Number(value || 0).toFixed(2)}R`;

  /* -------------------- HANDLE INPUT CHANGES -------------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setStrategy({
      ...strategy,
      [name]: value,
    });
  };

  /* -------------------- CREATE STRATEGY -------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!strategy.name.trim()) {
      toast.error("Strategy name is required");
      return;
    }

    if (actionLoading) return;

    const maxStrategies = getMaxStrategies(isPro);
    if (strategies.length >= maxStrategies) {
      toast.error(
        isPro
          ? `Pro plan strategy limit (${maxStrategies}) reached`
          : `Free plan strategy limit (${maxStrategies}) reached. Upgrade to Pro.`
      );
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/strategy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authorizationToken,
          },
          body: JSON.stringify(strategy),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Strategy created successfully");
        setStrategy({ name: "", description: "" });
        refreshStrategyData();
      } else {
        toast.error(data.message || "Failed to create strategy");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error creating strategy");
    } finally {
      setActionLoading(false);
    }
  };

  /* -------------------- FETCH STRATEGIES -------------------- */
  const getStrategies = async () => {
    setLoadingStrategies(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/strategy`,
        {
          method: "GET",
          headers: {
            Authorization: authorizationToken,
          },
        }
      );

      if (!response.ok) {
        toast.error("Failed to fetch strategies");
        return;
      }

      const res_data = await response.json();
      setStrategies(res_data);
    } catch (error) {
      console.error(error);
      toast.error("Error fetching strategies");
    } finally {
      setLoadingStrategies(false);
    }
  };

  const getStrategyStats = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/analytics?dimension=strategy&sortBy=expectancy&order=desc`,
        {
          method: "GET",
          headers: {
            Authorization: authorizationToken,
          },
        },
      );

      if (!response.ok) {
        return;
      }

      const statsRows = await response.json();
      const statsMap = statsRows.reduce((acc, row) => {
        const key = normalizeName(row?.name);
        if (key) acc[key] = row;
        return acc;
      }, {});

      setStrategyStats(statsMap);
    } catch (error) {
      console.error(error);
    }
  };

  const refreshStrategyData = async () => {
    await Promise.all([getStrategies(), getStrategyStats()]);
  };

  useEffect(() => {
    refreshStrategyData();
  }, []);

  /* -------------------- DELETE STRATEGY -------------------- */
  const openDeleteModal = (id) => {
    setStrategyToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!strategyToDelete) return;
    if (actionLoading) return;

    try {
      setActionLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/strategy/${strategyToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: authorizationToken,
          },
        }
      );

      if (response.ok) {
        toast.success("Strategy deleted");
        refreshStrategyData();
      } else {
        toast.error("Failed to delete strategy");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server error");
    } finally {
      setIsDeleteModalOpen(false);
      setStrategyToDelete(null);
      setActionLoading(false);
    }
  };

  /* -------------------- UPDATE STRATEGY -------------------- */
  const openUpdateModal = (strat) => {
    setStrategyToUpdate(strat);
    setStrategy({ name: strat.name, description: strat.description || "" });
    setIsUpdateModalOpen(true);
  };

  const confirmUpdate = async () => {
    if (!strategyToUpdate) return;
    if (actionLoading) return;

    if (!strategy.name.trim()) {
      toast.error("Strategy name is required");
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/strategy/${strategyToUpdate._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: authorizationToken,
          },
          body: JSON.stringify({
            name: strategy.name,
            description: strategy.description,
          }),
        }
      );

      if (response.ok) {
        toast.success("Strategy updated");
        setStrategy({ name: "", description: "" });
        setIsUpdateModalOpen(false);
        setStrategyToUpdate(null);
        refreshStrategyData();
      } else {
        toast.error("Failed to update strategy");
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
    <div className={`${styles.strategyPage} app-page`}>
      <div className={styles.mainContent}>
        {/* Page Heading */}
        <div className={styles.heading}>
          <h2>Manage Strategies</h2>
          <p>Track performance by strategy and identify your trading edge</p>
        </div>

        {/* Create Strategy Form */}
        <form className={styles.createForm} onSubmit={handleSubmit}>
          <h3>Create New Strategy</h3>

          <div className={styles.formGroup}>
            <label>Strategy Name</label>
            <input
              type="text"
              name="name"
              value={strategy.name}
              onChange={handleChange}
              placeholder="Enter strategy name..."
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description (Optional)</label>
            <textarea
              name="description"
              value={strategy.description}
              onChange={handleChange}
              placeholder="Describe your strategy, entry/exit rules, etc..."
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={actionLoading}>
            {actionLoading ? "Saving..." : "Create Strategy"}
          </button>
        </form>

        {/* Strategies List */}
        <div className={styles.strategiesSection}>
          <h3>Your Strategies</h3>

          {loadingStrategies ? (
            <div className={styles.loadingState}>
              <SkeletonText lines={1} width="180px" />
              <div className={styles.strategySkeletonList}>
                <SkeletonCard className={styles.strategySkeletonCard} rows={2} withHeader />
                <SkeletonCard className={styles.strategySkeletonCard} rows={2} withHeader />
                <SkeletonCard className={styles.strategySkeletonCard} rows={2} withHeader />
              </div>
            </div>
          ) : strategies.length === 0 ? (
            <p className={styles.noStrategies}>
              No strategies yet. Create your first strategy above!
            </p>
          ) : (
            <div className={styles.strategiesList}>
              {strategies.map((strat) => (
                (() => {
                  const currentStats = strategyStats[normalizeName(strat.name)] || {};
                  return (
                <div key={strat._id} className={styles.strategyCard}>
                  <div className={styles.strategyHeader}>
                    <div className={styles.strategyInfo}>
                      <h4 className={styles.strategyName}>
                        <svg
                          className={styles.strategyIcon}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        {strat.name}
                      </h4>
                      {strat.description && (
                        <p className={styles.strategyDescription}>
                          {strat.description}
                        </p>
                      )}

                      <div className={styles.strategyStatsRow}>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Win Rate</span>
                          <span className={styles.statValue}>
                            {formatWinRate(currentStats.winRate)}
                          </span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Expectancy</span>
                          <span className={styles.statValue}>
                            {formatExpectancy(currentStats.expectancy)}
                          </span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Trades</span>
                          <span className={styles.statValue}>
                            {Number(currentStats.totalTrades || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.strategyActions}>
                      <button
                        onClick={() => openUpdateModal(strat)}
                        className={styles.editBtn}
                        disabled={actionLoading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(strat._id)}
                        className={styles.deleteBtn}
                        disabled={actionLoading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {strat.createdAt && (
                    <div className={styles.strategyMeta}>
                      <span className={styles.metaItem}>
                        <svg
                          className={styles.metaIcon}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Created {new Date(strat.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                  );
                })()
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Strategy?"
        message="This strategy will be permanently deleted and removed from all trades where it's used. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setStrategyToDelete(null);
        }}
        onConfirm={confirmDelete}
      />

      {/* Update Strategy Modal */}
      {isUpdateModalOpen && (
        <StrategyUpdateModal
          strategy={strategy}
          setStrategy={setStrategy}
          loading={actionLoading}
          onCancel={() => {
            setIsUpdateModalOpen(false);
            setStrategyToUpdate(null);
            setStrategy({ name: "", description: "" });
          }}
          onConfirm={confirmUpdate}
        />
      )}
    </div>
  );
};

/* -------------------- STRATEGY UPDATE MODAL -------------------- */
const StrategyUpdateModal = ({ strategy, setStrategy, loading, onCancel, onConfirm }) => {
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Update Strategy</h3>

        <div className={styles.formGroup}>
          <label>Strategy Name</label>
          <input
            type="text"
            name="name"
            value={strategy.name}
            onChange={(e) =>
              setStrategy({ ...strategy, name: e.target.value })
            }
            placeholder="Enter strategy name..."
          />
        </div>

        <div className={styles.formGroup}>
          <label>Description (Optional)</label>
          <textarea
            name="description"
            value={strategy.description}
            onChange={(e) =>
              setStrategy({ ...strategy, description: e.target.value })
            }
            placeholder="Describe your strategy..."
          />
        </div>

        <div className={styles.modalActions}>
          <button onClick={onCancel} className={styles.cancelBtn} disabled={loading}>
            Cancel
          </button>
          <button onClick={onConfirm} className={styles.confirmBtn} disabled={loading}>
            {loading ? "Saving..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
};
