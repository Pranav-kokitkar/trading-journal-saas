import React, { useState, useRef } from "react";
import styles from "./contact.module.css";
import { Link, Navigate } from "react-router-dom";
import { Navbar } from "../../Layout/Navbar";
import { Footer } from "../../Layout/Footer";
import { useAuth } from "../../../store/Auth";

export const Contact= () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [userData, setUserData] = useState(true)
  const fileRef = useRef();
  const {isLoggedIn} = useAuth();
  const {user} = useAuth();

  if(isLoggedIn){
    if(userData && user){
      setForm((prev) => ({
        ...prev, 
        name: user.name || prevForm.name, 
        email: user.email || prevForm.email, 
      }));
      setUserData(false);
    }
  }

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email";
    if (!form.subject.trim()) e.subject = "Subject is required";
    if (!form.message.trim()) e.message = "Message is required";
    return e;
  };

  const handleChange = (ev) => {
    const { name, value } = ev.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleFile = (ev) => {
    const f = ev.target.files?.[0];
    if (!f) return;
    setFile(f);
  };

  const removeFile = () => {
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;

    // Build payload (replace with API call)
    const payload = {
      ...form,
      screenshot: file ? file.name : null,
      ts: new Date().toISOString(),
    };

    console.log("Contact submit:", payload);
    alert("Thanks — your message has been submitted. (check console)");

    // reset
    setForm({ name: "", email: "", subject: "", message: "" });
    removeFile();
    setErrors({});
  };

  return (
    <div className={`${styles.container} ${!isLoggedIn && styles.containerbg}`}>
      {!isLoggedIn ? <Navbar /> : ""}

      <main className={styles.hero}>
        <h1 className={styles.title}>
          Contact <span>Support</span>
        </h1>

        <p className={styles.subtitle}>
          Found a bug or need help? Send us a message and a brief description —
          attaching a screenshot helps us reproduce the issue faster.
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.row}>
            <label className={styles.field}>
              Name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className={styles.input}
                placeholder="Your name"
                readOnly={isLoggedIn}
              />
              {errors.name && <div className={styles.err}>{errors.name}</div>}
            </label>

            <label className={styles.field}>
              Email
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                className={styles.input}
                placeholder="you@domain.com"
                readOnly={isLoggedIn}
              />
              {errors.email && <div className={styles.err}>{errors.email}</div>}
            </label>
          </div>

          <label className={styles.field}>
            Subject
            <input
              name="subject"
              value={form.subject}
              onChange={handleChange}
              className={styles.input}
              placeholder="Short summary"
            />
            {errors.subject && (
              <div className={styles.err}>{errors.subject}</div>
            )}
          </label>

          <label className={styles.field}>
            Message
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="Describe the issue, steps to reproduce, expected vs actual..."
              rows={6}
            />
            {errors.message && (
              <div className={styles.err}>{errors.message}</div>
            )}
          </label>

          <div className={styles.uploadRow}>
            <div className={styles.uploadimage}>
              <div className={styles.uploadLabel}>
                Upload screenshot (optional)
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className={styles.fileInput}
                id="contact-screenshot"
              />
              <label htmlFor="contact-screenshot" className={styles.uploadBtn}>
                {file ? "Replace screenshot" : "Upload screenshot"}
              </label>

              {file && (
                <button
                  type="button"
                  onClick={removeFile}
                  className={styles.removeBtn}
                >
                  Remove
                </button>
              )}
              <div className={styles.hint}>
                <small className={styles.muted}>
                  A screenshot helps us reproduce the issue faster. Max 5MB
                  recommended.
                </small>
              </div>
            </div>
          </div>

          <div className={styles.ctaRow}>
            <Link to="/" className={styles.secondaryBtn}>
              Back
            </Link>

            <button type="submit" className={styles.primaryBtn}>
              Send Message
            </button>
          </div>
        </form>
      </main>

      {!isLoggedIn ? <Footer /> : ""}
    </div>
  );
};
