import { Outlet } from "react-router-dom";
import styles from "../../Layout/Layout.module.css"
import {AdminSidebar} from "../adminSidebar/AdminSidebar";
import { useState } from "react";

export const AdminLayout = () => {
   const [isOpen, setIsOpen] = useState(false);
   return (
     <div className={styles.layout}>
       {/* Sidebar */}
       <aside className={`${styles.sidebar} ${isOpen ? styles.show : ""}`}>
         <AdminSidebar />
       </aside>

       {/* Mobile Header */}
       <header className={styles.mobileHeader}>
         <button
           className={styles.hamburger}
           onClick={() => setIsOpen(!isOpen)}
         >
           <span></span>
           <span></span>
           <span></span>
         </button>
         <h3>TradingJournal</h3>
       </header>

       {/* Main content */}
       <main className={styles.outlet}>
         <Outlet />
       </main>
     </div>
   );
};