"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * NProgress-style top bar that shows ONLY on real route (pathname) changes.
 *
 * It starts on an internal link click or a history.pushState whose pathname
 * actually differs, and completes when usePathname() changes. It deliberately
 * does NOT patch replaceState (Next.js calls it on initial load / shallow
 * updates, which would otherwise make the bar stick) and never reacts to tab
 * switches or same-page interactions. A watchdog guarantees it always finishes.
 */
export default function TopProgressBar() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const trickle = useRef(null);
  const hideT = useRef(null);
  const watchdog = useRef(null);
  const started = useRef(false);

  function start() {
    if (started.current) return;        // already running for this navigation
    started.current = true;
    clearTimeout(hideT.current);
    setVisible(true);
    setProgress(8);
    trickle.current = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + Math.max(0.5, (90 - p) * 0.12)));
    }, 200);
    watchdog.current = setTimeout(finish, 6000); // safety: never stay stuck
  }

  function finish() {
    if (!started.current) return;
    started.current = false;
    clearInterval(trickle.current);
    clearTimeout(watchdog.current);
    setProgress(100);
    hideT.current = setTimeout(() => { setVisible(false); setProgress(0); }, 250);
  }

  // Complete whenever the route actually changes (no-op on first mount).
  useEffect(() => { finish(); /* eslint-disable-next-line */ }, [pathname]);

  useEffect(() => {
    const samePath = (href) => {
      try { return new URL(href, window.location.href).pathname === window.location.pathname; }
      catch { return true; }
    };

    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || a.target === "_blank" || a.hasAttribute("download")) return;
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      try { if (new URL(href, window.location.href).origin !== window.location.origin) return; } catch { return; }
      if (samePath(href)) return;       // same page → not a navigation
      start();
    };

    // Patch pushState only (router.push / Link). NOT replaceState.
    const origPush = window.history.pushState;
    window.history.pushState = function (state, title, url) {
      if (url != null && !samePath(String(url))) start();
      return origPush.apply(this, arguments);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      window.history.pushState = origPush;
      document.removeEventListener("click", onClick, true);
      clearInterval(trickle.current);
      clearTimeout(watchdog.current);
      clearTimeout(hideT.current);
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
