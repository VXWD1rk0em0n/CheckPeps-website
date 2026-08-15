/**
 * CheckPeps marketing site — the only script on the page.
 *
 * Scope is deliberately tiny: toggle the mobile nav. No analytics, no network
 * calls, no third-party tags, no form handling. Adding any of those here means
 * re-reviewing what data leaves the visitor's browser.
 */
(function () {
  "use strict";

  var toggle = document.querySelector(".nav__toggle");
  var nav = document.getElementById("site-nav");

  if (!toggle || !nav) return;

  var mobile = window.matchMedia("(max-width: 860px)");

  function setOpen(open) {
    toggle.setAttribute("aria-expanded", String(open));
    nav.hidden = !open;
  }

  // Above the breakpoint the nav is always visible and the toggle is display:none,
  // so `hidden` must be cleared or the links vanish on resize back to desktop.
  function sync() {
    if (mobile.matches) {
      setOpen(false);
    } else {
      nav.hidden = false;
      toggle.setAttribute("aria-expanded", "false");
    }
  }

  toggle.addEventListener("click", function () {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  // Escape closes and returns focus to the control that opened it.
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (toggle.getAttribute("aria-expanded") !== "true") return;
    setOpen(false);
    toggle.focus();
  });

  nav.addEventListener("click", function (event) {
    if (mobile.matches && event.target.closest("a")) setOpen(false);
  });

  mobile.addEventListener("change", sync);
  sync();
})();
