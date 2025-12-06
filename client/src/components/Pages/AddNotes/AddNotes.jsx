import { useEffect, useState } from "react";
import styles from "./AddNotes.module.css";
import { DisplayNotes } from "./DisplayNotes";
import { useAuth } from "../../../store/Auth";
import { toast } from "react-toastify";

export const AddNotes = () => {
  const [notes, setNotes] = useState([]);
  const [note, setNote] = useState({ title: "", description: "" });

  const { authorizationToken } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNote((prev) => ({ ...prev, [name]: value })); // ✅ update the single note
  };

  const handleSubmit = async (e) => {
    if (note.title.trim() === "" && note.description.trim() === "") return;
    e.preventDefault();
    console.log(note);

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
        toast.success("Note added", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
        getAllNotes();
      } else {
       toast.error("Failed to add note", {
         position: "top-right",
         autoClose: 2000,
         hideProgressBar: false,
         closeOnClick: false,
         pauseOnHover: true,
         draggable: true,
         progress: undefined,
         theme: "dark",
       });
      }
    } catch (error) {
      console.log("add notes error", error);
    }
  };

  const getAllNotes = async ()=>{
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
      if(response.ok){
        console.log("notes fetched")
        setNotes(res_data);
      }
    } catch (error) {
      console.log("error while getting all notes",error)
    }
  }

  useEffect(()=>{
    getAllNotes();
  },[])


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
      <DisplayNotes notes={notes} getAllNotes={getAllNotes} />
    </section>
  );
};
