import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../../../store/Auth";
import { ConfirmationModal } from "../../../modals/ConfirmationModal/ConfirmationModal";
import styles from "./Strategy.module.css";

export const Strategy = () => {
  const { authorizationToken } = useAuth();

  const [strategy, setStrategy] = useState({
    name: "",
    description: "",
  });

  const [strategies, setStrategies] = useState([]);
  const [loadingStrategies, setLoadingStrategies] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [strategyToDelete, setStrategyToDelete] = useState(null);
  const [strategyToUpdate, setStrategyToUpdate] = useState(null);

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

    try {
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
        getStrategies();
      } else {
        toast.error(data.message || "Failed to create strategy");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error creating strategy");
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

  useEffect(() => {
    getStrategies();
  }, []);

  /* -------------------- DELETE STRATEGY -------------------- */
  const openDeleteModal = (id) => {
    setStrategyToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!strategyToDelete) return;

    try {
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
        getStrategies();
      } else {
        toast.error("Failed to delete strategy");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server error");
    } finally {
      setIsDeleteModalOpen(false);
      setStrategyToDelete(null);
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

    if (!strategy.name.trim()) {
      toast.error("Strategy name is required");
      return;
    }

    try {
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
        getStrategies();
      } else {
        toast.error("Failed to update strategy");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server error");
    }
  };

  /* -------------------- UI -------------------- */
  return (
    <div className={styles.strategyPage}>
      <div className={styles.mainContent}>
        {/* Page Heading */}
        <div className={styles.heading}>
          <h2>Manage Strategies</h2>
          <p>Create and organize trading strategies to categorize your trades</p>
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

          <button type="submit" className={styles.submitBtn}>
            Create Strategy
          </button>
        </form>

        {/* Strategies List */}
        <div className={styles.strategiesSection}>
          <h3>Your Strategies</h3>

          {loadingStrategies ? (
            <p className={styles.loadingState}>Loading strategies...</p>
          ) : strategies.length === 0 ? (
            <p className={styles.noStrategies}>
              No strategies yet. Create your first strategy above!
            </p>
          ) : (
            <div className={styles.strategiesList}>
              {strategies.map((strat) => (
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
                    </div>

                    <div className={styles.strategyActions}>
                      <button
                        onClick={() => openUpdateModal(strat)}
                        className={styles.editBtn}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(strat._id)}
                        className={styles.deleteBtn}
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
const StrategyUpdateModal = ({ strategy, setStrategy, onCancel, onConfirm }) => {
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
          <button onClick={onCancel} className={styles.cancelBtn}>
            Cancel
          </button>
          <button onClick={onConfirm} className={styles.confirmBtn}>
            Update
          </button>
        </div>
      </div>
    </div>
  );
};
