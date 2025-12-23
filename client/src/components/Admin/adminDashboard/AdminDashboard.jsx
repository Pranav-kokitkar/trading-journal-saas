import { useEffect, useState } from "react";
import { useAuth } from "../../../store/Auth";

import { AdminUserSection } from "./AdminUserSection";
import { AdminAccountsSection } from "./AdminAccountsSection";
import { AdminTradesSection } from "./AdminTradesSection";
import { AdminContactsSection } from "./AdminContactsSection";

import styles from "./AdminDashboard.module.css";

export const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { authorizationToken } = useAuth();

  const getStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/dashboard`,
        {
          method: "GET",
          headers: {
            Authorization: authorizationToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      const res_data = await response.json();
      setDashboardData(res_data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getStats();
  }, [authorizationToken]);

  if (loading) {
    return <p className={styles.loading}>Loading dashboard...</p>;
  }

  return (
    <section className={styles.dashboard}>
      {/* ================= SUMMARY ROW ================= */}
      <header className={styles.header}>
        <h2>Admin Dashboard</h2>
        <p>System overview and platform health</p>
      </header>

      <div className={styles.cardsGrid}>
        <div className={styles.card}>
          <p className={styles.label}>Total Users</p>
          <h3 className={styles.value}>
            {dashboardData.users.cards.totalUsers}
          </h3>
        </div>

        <div className={styles.card}>
          <p className={styles.label}>Total Accounts</p>
          <h3 className={styles.value}>
            {dashboardData.accounts.cards.totalAccounts}
          </h3>
        </div>

        <div className={styles.card}>
          <p className={styles.label}>Total Trades</p>
          <h3 className={styles.value}>
            {dashboardData.trades.cards.totalTrades}
          </h3>
        </div>

        <div className={styles.card}>
          <p className={styles.label}>Total Contact Messages</p>
          <h3 className={styles.value}>{dashboardData.contacts.cards.totalContacts}</h3>
        </div>
      </div>

      {/* ================= SECTIONS ================= */}
      <AdminUserSection data={dashboardData.users} />
      <AdminAccountsSection data={dashboardData.accounts} />
      <AdminTradesSection data={dashboardData.trades} />
      <AdminContactsSection data={dashboardData.contacts} />
    </section>
  );
};
