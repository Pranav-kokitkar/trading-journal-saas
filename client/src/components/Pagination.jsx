import styles from "./Pagination.module.css";

export const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];

  const addPage = (p) => {
    if (!pages.includes(p)) {
      pages.push(p);
    }
  };

  // Always show first page
  addPage(1);

  // Left ellipsis
  if (page > 4) {
    pages.push("...");
  }

  // Middle window
  const start = Math.max(2, page - 2);
  const end = Math.min(totalPages - 1, page + 2);

  for (let i = start; i <= end; i++) {
    addPage(i);
  }

  // Right ellipsis
  if (page < totalPages - 3) {
    pages.push("...");
  }

  // Always show last page
  addPage(totalPages);

  return (
    <div className={styles.pagination}>
      {pages.map((item, index) =>
        item === "..." ? (
          <span key={`ellipsis-${index}`} className={styles.ellipsis}>
            ...
          </span>
        ) : (
          <button
            key={item}
            className={page === item ? styles.active : ""}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        )
      )}
    </div>
  );
};
