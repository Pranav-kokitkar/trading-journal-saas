import { useEffect } from "react";

// Locks body scroll while preserving the current scroll position.
// Supports nested modals by using a shared lock counter on window.
export const useBodyScrollLock = (isLocked = true) => {
  useEffect(() => {
    if (!isLocked || typeof window === "undefined") return;

    const BODY_LOCK_COUNT_KEY = "__tjBodyLockCount";
    const BODY_SCROLL_Y_KEY = "__tjBodyLockScrollY";
    const BODY_SCROLL_X_KEY = "__tjBodyLockScrollX";

    const currentCount = Number(window[BODY_LOCK_COUNT_KEY] || 0);

    if (currentCount === 0) {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const scrollX = window.scrollX || window.pageXOffset || 0;
      window[BODY_SCROLL_Y_KEY] = scrollY;
      window[BODY_SCROLL_X_KEY] = scrollX;

      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = `-${scrollX}px`;
      document.body.style.right = "0";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.body.style.overflowX = "hidden";
    }

    window[BODY_LOCK_COUNT_KEY] = currentCount + 1;

    return () => {
      const nextCount = Number(window[BODY_LOCK_COUNT_KEY] || 1) - 1;
      window[BODY_LOCK_COUNT_KEY] = Math.max(nextCount, 0);

      if (window[BODY_LOCK_COUNT_KEY] === 0) {
        const scrollY = Number(window[BODY_SCROLL_Y_KEY] || 0);
        const scrollX = Number(window[BODY_SCROLL_X_KEY] || 0);

        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        document.body.style.overflowX = "";

        window.scrollTo(scrollX, scrollY);
      }
    };
  }, [isLocked]);
};
