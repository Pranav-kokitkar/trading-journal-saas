import { useState } from "react";
import styles from "./AddNotes.module.css";
import { DisplayNotes } from "./DisplayNotes";
import { v4 as uuidv4 } from "uuid";
import FilterPanel from "../Comparision/FilterPanel";


export const AddNotes = () => {
  const [notes, setNotes] = useState([]); // all saved notes
  const [note, setNote] = useState({ title: "", description: "" }); // current note being typed

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNote((prev) => ({ ...prev, [name]: value })); // ✅ update the single note
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (note.title.trim() === "" && note.description.trim() === "") return;

    const newNote = { id: uuidv4(), ...note }; // ✅ attach unique id

    setNotes([...notes, newNote]);
    setNote({ title: "", description: "" });
    console.log("note added");
  };

  const deleteNote =(id)=>{
    setNotes((prevNotes)=>prevNotes.filter((note)=>note.id !==id));
    console.log("deleted");
  }

  return (
    <section className={styles.addnotescontainer}>
      <form className={styles.addnotes} onSubmit={handleSubmit}>
        <div>
          <h3>Add New Notes</h3>

          <div className={styles.addnotesinputfiled}>
            <div className={styles.row2}>
              <label>Title:</label>
              <input
                type="text"
                name="title"
                value={note.title}
                onChange={handleChange}
              />
            </div>

            <div className={styles.row2}>
              <label>Note:</label>
              <textarea
                name="description"
                value={note.description}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.addnotebutton}>
            <button type="submit">Save Note</button>
          </div>
        </div>
      </form>
      <DisplayNotes notes={notes} onDelete={deleteNote}/>
    </section>
    
  );
};
