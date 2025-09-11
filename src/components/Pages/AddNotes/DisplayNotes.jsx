import styles from "./DisplayNotes.module.css";

export const DisplayNotes = ({notes}) => {
  return (
    <div className={styles.notessection}>
      <div className={styles.notes}>
        <h3>Saved Notes :</h3>
        <div>
          {notes.map((n, index) => (
            <div key={index} className={styles.noteCard}>
              <h4 className={styles.noteTitle}>{n.title}</h4>
              <p className={styles.noteDescription}>{n.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
