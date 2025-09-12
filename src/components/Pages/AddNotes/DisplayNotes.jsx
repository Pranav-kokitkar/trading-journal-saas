import styles from "./DisplayNotes.module.css";

export const DisplayNotes = ({notes, onDelete}) => {
  return (
    <div className={styles.notessection}>
      <div className={styles.notes}>
        <h3>Saved Notes :</h3>
        <div>
          {notes.map((n, index) => (
            <div key={index} className={styles.noteCard}>

              <div className={styles.notedata}>
                <h4 className={styles.noteTitle}>{n.title}</h4>
                <p className={styles.noteDescription}>{n.description}</p>
              </div>
              <div className={styles.notecarddelete}>
                <button
                  onClick={() => {
                    onDelete(n.id);
                  }}
                >
                  Delete
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
