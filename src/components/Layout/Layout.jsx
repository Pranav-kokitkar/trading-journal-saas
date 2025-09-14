import { Outlet } from "react-router-dom";
import { Sidebar } from "./SideBar";
import styles from "./Layout.module.css";

export const Layout = () => {
  return (
    <section className={styles.layout}>
      <div className={styles.sidebar}>
        <Sidebar />
      </div>
      <div className={styles.outlet}>
        <Outlet />
      </div>
    </section>
  );
};
