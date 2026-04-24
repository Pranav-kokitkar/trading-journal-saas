import React, { useState, useRef, useEffect } from "react";
import styles from "./contact.module.css";
import { Link } from "react-router-dom";
import { Navbar } from "../../Layout/Navbar";
import { Footer } from "../../Layout/Footer";
import { useAuth } from "../../../store/Auth";
import toast from "react-hot-toast";

export const Contact = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [userData, setUserData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef();

  const { isLoggedIn, user } = useAuth();

  // ✅ Prefill form from user once when logged in
  useEffect(() => {
    if (isLoggedIn && user && userData) {
      setForm((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
      }));
      setUserData(false);
    }
  }, [isLoggedIn, user, userData]);

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

  const handleSubmit = async (ev) => {
    ev.preventDefault();

    if (isSubmitting) return;

    // ✅ Run validation before submit
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    try {
      setIsSubmitting(true);
      // Use FormData instead of JSON to send text + file
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("subject", form.subject);
      formData.append("message", form.message);

      // "screenshot" must match upload.single("screenshot") in router
      if (file) {
        formData.append("screenshot", file);
      }

      const response = await fetch(
        `${(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))}/api/contact/`,
        {
          method: "POST",
          body: formData, // ❗ NO "Content-Type" header here – browser will set it
        }
      );

      if (response.ok) {
        toast.success("message submitted");

        setForm({
          name: isLoggedIn && user?.name ? user.name : "",
          email: isLoggedIn && user?.email ? user.email : "",
          subject: "",
          message: "",
        });

        setErrors({});
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
      } else {
        toast.error("Failed to submit");
      }
    } catch (error) {
      toast.error("Failed to submit, try re-login");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className={`${styles.container} ${!isLoggedIn && styles.containerbg}`}>
      {!isLoggedIn ? <Navbar /> : ""}

      <main className={styles.hero}>
        <h2 className="app-page-title">
          Report an Issue or Get <span>Help</span>
        </h2>

        <p className="app-page-subtitle">
          Describe your issue clearly — we’ll help you resolve it quickly.
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
              placeholder="Brief summary of the issue"
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
              placeholder="Describe what happened, what you expected, and what actually occurred."
              rows={6}
            />
            {errors.message && (
              <div className={styles.err}>{errors.message}</div>
            )}
          </label>

          <div className={styles.uploadRow}>
            <div className={styles.uploadimage}>
              
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className={styles.fileInput}
                id="contact-screenshot"
              />
              <label htmlFor="contact-screenshot" className={styles.uploadBtn}>
                {file ? "Replace " : "Upload screenshot (optional) "}
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
            <button type="submit" className={styles.primaryBtn} disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </div>

          <p className={styles.trustLine}>We typically respond within 24 hours.</p>
        </form>
      </main>

      {!isLoggedIn ? <Footer /> : ""}
    </div>
  );
};
