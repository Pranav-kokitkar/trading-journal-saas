import { useEffect, useState } from "react";
import styles from "./AddNotes.module.css";
import { DisplayNotes } from "./DisplayNotes";
import { useAuth } from "../../../store/Auth";
import toast from "react-hot-toast";

export const AddNotes = () => {
  const [notes, setNotes] = useState([]);
  const [note, setNote] = useState({ title: "", description: "" });

  const { authorizationToken } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNote((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (note.title.trim() === "" && note.description.trim() === "") return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/notes/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authorizationToken,
          },
          body: JSON.stringify(note),
        }
      );

      if (response.ok) {
        setNote({ title: "", description: "" });
        toast.success("Note added");
        getAllNotes();
      } else {
        toast.error("Failed to add note");
      }
    } catch (error) {
      toast.error("Failed to add note, try re-login");
    }
  };

  const getAllNotes = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/notes/`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: authorizationToken,
          },
        }
      );
      const res_data = await response.json();
      if (response.ok) {
        setNotes(res_data);
      }
    } catch (error) {
      toast.error("Failed to get notes, try re-login");
    }
  };

  useEffect(() => {
    getAllNotes();
  }, []);

  return (
    <section className={styles.addnotescontainer}>
      <div className={styles.mainContent}>
        {/* Page Heading - Consistent with other pages */}
        <div className={styles.heading}>
          <h2 className={styles.title}>
                    Notes
                  </h2>
          <p>Create and manage your trading notes and ideas</p>
        </div>

        {/* Add Note Form Card */}
        <form className={styles.addnotes} onSubmit={handleSubmit}>
          <h4>Add New Note</h4>

          <div className={styles.addnotesinputfiled}>
            <div className={styles.row2}>
              <label>Title:</label>
              <input
                type="text"
                name="title"
                placeholder="Enter note title..."
                value={note.title}
                onChange={handleChange}
              />
            </div>

            <div className={styles.row2}>
              <label>Description:</label>
              <textarea
                name="description"
                placeholder="Write your note content..."
                value={note.description}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.addnotebutton}>
            <button type="submit">Save Note</button>
          </div>
        </form>

        {/* Display Notes Section */}
        <div className={styles.notessection}>
          <h3>Saved Notes</h3>
          <DisplayNotes notes={notes} getAllNotes={getAllNotes} />
        </div>
      </div>
    </section>
  );
};
