"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Lightweight NProgress-style top loading bar shown on every route change.
 * Self-contained (no dependency): it starts when an internal link is clicked
 * or history is pushed, and completes once the pathname/query actually changes.
 */
function Bar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const trickle = useRef(null);
  const hideTimer = useRef(null);

  function start() {
    clearInterval(trickle.current);
    clearTimeout(hideTimer.current);
    setVisible(true);
    setProgress(8);
    trickle.current = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + Math.max(0.5, (90 - p) * 0.12)));
    }, 200);
  }

  function done() {
    clearInterval(trickle.current);
    setProgress(100);
    hideTimer.current = setTimeout(() => { setVisible(false); setProgress(0); }, 250);
  }

  // Complete whenever the route (path or query) changes.
  useEffect(() => { done(); /* eslint-disable-next-line */ }, [pathname, searchParams]);

  // Start on internal link clicks and history navigation.
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || a.target === "_blank" || a.hasAttribute("download")) return;
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      } catch { return; }
      start();
    };

    const patch = (type) => {
      const orig = history[type];
      return function (...args) {
        start();
        return orig.apply(this, args);
      };
    };
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = patch("pushState");
    history.replaceState = patch("replaceState");
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", start);

    return () => {
      history.pushState = origPush;
      history.replaceState = origReplace;
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", start);
      clearInterval(trickle.current);
      clearTimeout(hideTimer.current);
    };
  }, []);

  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-0.5">
      <div
        className="h-full bg-primary transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%`, boxShadow: "0 0 8px hsl(var(--primary)), 0 0 4px hsl(var(--primary))" }}
      />
    </div>
  );
}

export default function TopProgressBar() {
  // useSearchParams must live under a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}
