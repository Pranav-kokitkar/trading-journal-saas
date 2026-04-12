import { useEffect } from "react";

// Locks body scroll while preserving the current scroll position.
// Supports nested modals by using a shared lock counter on window.
export const useBodyScrollLock = (isLocked = true) => {
  useEffect(() => {
    if (!isLocked || typeof window === "undefined") return;

    const BODY_LOCK_COUNT_KEY = "__tjBodyLockCount";
    const BODY_SCROLL_Y_KEY = "__tjBodyLockScrollY";

    const currentCount = Number(window[BODY_LOCK_COUNT_KEY] || 0);

    if (currentCount === 0) {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      window[BODY_SCROLL_Y_KEY] = scrollY;

      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    }

    window[BODY_LOCK_COUNT_KEY] = currentCount + 1;

    return () => {
      const nextCount = Number(window[BODY_LOCK_COUNT_KEY] || 1) - 1;
      window[BODY_LOCK_COUNT_KEY] = Math.max(nextCount, 0);

      if (window[BODY_LOCK_COUNT_KEY] === 0) {
        const scrollY = Number(window[BODY_SCROLL_Y_KEY] || 0);

        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";
        document.body.style.overflow = "";

        window.scrollTo(0, scrollY);
      }
    };
  }, [isLocked]);
};
