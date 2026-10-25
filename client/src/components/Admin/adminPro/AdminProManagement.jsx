import { useCallback, useEffect, useState } from "react";
import { FaCrown } from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "../../../store/Auth";
import { API_BASE_URL } from "../../../config/api";
import styles from "./AdminProManagement.module.css";

const reasonLabels = {
  founder_owner: "Founder/Owner",
  friend: "Friend",
  beta_promotional: "Beta Tester/Promotional",
};

const emptyForm = { email: "", duration: "lifetime", expiresAt: "", reason: "founder_owner", note: "" };

export const AdminProManagement = () => {
  const { authorizationToken } = useAuth();
  const [data, setData] = useState({ summary: {}, users: [], history: [] });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadData = useCallback(async (query = search) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/pro-management?search=${encodeURIComponent(query)}`, {
        headers: { Authorization: authorizationToken },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to load Pro management");
      setData(result);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [authorizationToken, search]);

  useEffect(() => {
    const timer = setTimeout(() => loadData(), 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  const updateForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const grantAccess = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/pro-management`, {
        method: "POST",
        headers: { Authorization: authorizationToken, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to grant Pro access");
      toast.success("Complimentary Pro access granted");
      setDialogOpen(false);
      setForm(emptyForm);
      await loadData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const revokeAccess = async (userId) => {
    if (!window.confirm("Revoke complimentary Pro access for this user?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/pro-management/${userId}`, {
        method: "DELETE",
        headers: { Authorization: authorizationToken },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to revoke Pro access");
      toast.success("Complimentary Pro access revoked");
      await loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}><FaCrown /> Entitlements</p>
          <h2>Pro Management</h2>
          <p>Manage complimentary access without changing paid subscriptions.</p>
        </div>
      </header>

      <div className={styles.summaryGrid}>
        {[["Total Pro Users", "totalProUsers"], ["Paid Pro Users", "paidProUsers"], ["Lifetime Grants", "lifetimeGrants"], ["Temporary Grants", "temporaryGrants"]].map(([label, key]) => (
          <div className={styles.summaryCard} key={key}><span>{label}</span><strong>{data.summary[key] || 0}</strong></div>
        ))}
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3>Users</h3>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or email" aria-label="Search users" />
        </div>
        <div className={styles.tableWrap}>
          <table><thead><tr><th>User</th><th>Pro Status</th><th>Access Source</th><th>Grant Expiration</th><th>Action</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan="5" className={styles.empty}>Loading users...</td></tr> : data.users.length === 0 ? <tr><td colSpan="5" className={styles.empty}>No users found.</td></tr> : data.users.map((user) => (
              <tr key={user._id}><td><strong>{user.email}</strong><small>{user.name}</small></td><td><span className={`${styles.badge} ${user.isPro ? styles.active : styles.inactive}`}>{user.isPro ? "Active" : "Free"}</span></td><td>{user.accessSource}</td><td>{user.grantExpiration ? new Date(user.grantExpiration).toLocaleDateString() : user.grantDuration === "lifetime" ? "Lifetime" : "-"}</td><td>{user.grantId ? <button className={styles.dangerButton} onClick={() => revokeAccess(user._id)}>Revoke</button> : <button className={styles.linkButton} onClick={() => { setForm({ ...emptyForm, email: user.email }); setDialogOpen(true); }}>Grant</button>}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}><h3>Grant History</h3></div>
        <div className={styles.tableWrap}><table><thead><tr><th>User</th><th>Action</th><th>Reason</th><th>Admin</th><th>Timestamp</th></tr></thead>
          <tbody>{data.history.length === 0 ? <tr><td colSpan="5" className={styles.empty}>No grant history yet.</td></tr> : data.history.map((entry) => <tr key={entry._id}><td>{entry.user?.email || "Deleted user"}</td><td><span className={`${styles.badge} ${entry.action === "grant" ? styles.active : styles.revoked}`}>{entry.action}</span></td><td>{reasonLabels[entry.reason] || entry.reason}</td><td>{entry.admin?.email || "Unknown admin"}</td><td>{new Date(entry.timestamp).toLocaleString()}</td></tr>)}</tbody>
        </table></div>
      </section>

      {dialogOpen && <div className={styles.overlay} role="presentation"><form className={styles.dialog} role="dialog" aria-modal="true" onSubmit={grantAccess}><div className={styles.dialogHeader}><h3>Grant Complimentary Pro</h3><button type="button" className={styles.closeButton} onClick={() => setDialogOpen(false)} aria-label="Close">×</button></div>
        <label>User email<input type="email" name="email" value={form.email} onChange={updateForm} placeholder="user@example.com" autoComplete="off" required /></label>
        <label>Access duration<select name="duration" value={form.duration} onChange={updateForm}><option value="lifetime">Lifetime</option><option value="temporary">Temporary</option></select></label>
        {form.duration === "temporary" && <label>Expires at<input type="datetime-local" name="expiresAt" value={form.expiresAt} onChange={updateForm} required /></label>}
        <label>Reason<select name="reason" value={form.reason} onChange={updateForm}>{Object.entries(reasonLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Internal note (optional)<textarea name="note" value={form.note} onChange={updateForm} maxLength="500" /></label>
        <div className={styles.dialogActions}><button type="button" className={styles.secondaryButton} onClick={() => setDialogOpen(false)}>Cancel</button><button type="submit" className={styles.primaryButton} disabled={saving}>{saving ? "Granting..." : "Grant Access"}</button></div>
      </form></div>}
    </section>
  );
};