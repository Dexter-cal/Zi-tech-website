
      /*!
       * responsive.js — Zitech Limited
       * ------------------------------------------------------------------
       * Drop-in, dependency-free script that makes the rest of the site
       * behave well across phones, tablets and desktops. It does NOT touch
       * your routing/render logic in index.html — it only adds behaviour
       * on top of it, so it's safe to include on any page.
       *
       * What it does:
       *   1. Fixes the classic mobile "100vh" bug (address bar resizing)
       *      by exposing a --vh CSS variable you can use instead of vh.
       *   2. Adds live breakpoint classes to <html> (is-mobile / is-tablet /
       *      is-desktop) and an is-touch class, so CSS/JS can react to them.
       *   3. Hardens the mobile menu: closes on Escape, on outside click,
       *      and locks page scroll while it's open (works with the existing
       *      #nav-burger / #mobile-menu / #mm-close markup already in
       *      index.html — no changes needed there).
       *   4. Lazy-fades images in as they load (adds .is-loaded once an
       *      <img> has loaded, used by the .ph-img placeholders).
       *   5. Provides a tiny responsive-image helper so you can later swap
       *      in real photos at different sizes per breakpoint by adding
       *      data-src-mobile / data-src-tablet / data-src-desktop attributes
       *      to any <img> — no other code changes required.
       *   6. Wraps any wide tables/iframes so they scroll horizontally on
       *      small screens instead of breaking the layout.
       *
       * Everything is namespaced under a single IIFE, debounced, and only
       * runs the parts that find matching elements — safe to include on
       * every page of the site.
       * ------------------------------------------------------------------
       */
      (function () {
        "use strict";

        var BREAKPOINTS = { mobile: 640, tablet: 960 };

        /* ---------------------------------------------------------------
         * Small utility: debounce
         * ------------------------------------------------------------- */
        function debounce(fn, wait) {
          var t;
          return function () {
            var args = arguments;
            clearTimeout(t);
            t = setTimeout(function () {
              fn.apply(null, args);
            }, wait);
          };
        }

        /* ---------------------------------------------------------------
         * 1. Real viewport height (--vh) — fixes mobile browser chrome
         *    resizing the viewport under your feet.
         *    Usage in CSS: height: calc(var(--vh, 1vh) * 100);
         * ------------------------------------------------------------- */
        function setViewportHeightVar() {
          var vh = window.innerHeight * 0.01;
          document.documentElement.style.setProperty("--vh", vh + "px");
        }

        /* ---------------------------------------------------------------
         * 2. Breakpoint + touch classes on <html>
         * ------------------------------------------------------------- */
        function updateBreakpointClasses() {
          var w = window.innerWidth;
          var html = document.documentElement;
          var isMobile = w <= BREAKPOINTS.mobile;
          var isTablet = w > BREAKPOINTS.mobile && w <= BREAKPOINTS.tablet;
          var isDesktop = w > BREAKPOINTS.tablet;

          html.classList.toggle("is-mobile", isMobile);
          html.classList.toggle("is-tablet", isTablet);
          html.classList.toggle("is-desktop", isDesktop);

          // Let the rest of the app react if it wants to (e.g. close menus,
          // re-measure carousels) without coupling this file to app.js.
          html.dispatchEvent(
            new CustomEvent("breakpointchange", {
              detail: {
                isMobile: isMobile,
                isTablet: isTablet,
                isDesktop: isDesktop,
                width: w,
              },
            }),
          );
        }

        function markTouchDevice() {
          var isTouch =
            "ontouchstart" in window ||
            (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
          document.documentElement.classList.toggle("is-touch", !!isTouch);
        }

        /* ---------------------------------------------------------------
         * 3. Mobile menu hardening
         *    Index.html already toggles #mobile-menu's "open" class via
         *    #nav-burger / #mm-close. We only add the extra behaviours
         *    that are easy to forget: Escape key, outside click, and
         *    scroll locking.
         * ------------------------------------------------------------- */
        function enhanceMobileMenu() {
          var menu = document.getElementById("mobile-menu");
          var burger = document.getElementById("nav-burger");
          if (!menu || !burger) return;

          function isOpen() {
            return menu.classList.contains("open");
          }
          function close() {
            menu.classList.remove("open");
            document.documentElement.classList.remove("nav-locked");
          }

          // Keep an eye on the class the existing app code toggles, so we
          // can lock/unlock scroll in sync without duplicating that logic.
          var observer = new MutationObserver(function () {
            document.documentElement.classList.toggle("nav-locked", isOpen());
          });
          observer.observe(menu, {
            attributes: true,
            attributeFilter: ["class"],
          });

          document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && isOpen()) close();
          });

          document.addEventListener("click", function (e) {
            if (!isOpen()) return;
            var clickedInsideMenu = menu.contains(e.target);
            var clickedBurger = burger.contains(e.target);
            if (!clickedInsideMenu && !clickedBurger) close();
          });

          // If the viewport grows into desktop size while the menu is open
          // (e.g. rotating a tablet, or resizing a browser window), close it.
          document.documentElement.addEventListener(
            "breakpointchange",
            function (e) {
              if (e.detail.isDesktop && isOpen()) close();
            },
          );
        }

        // Simple CSS hook for scroll locking; injected once so this file
        // has zero external CSS dependency.
        function injectScrollLockStyle() {
          if (document.getElementById("responsive-js-styles")) return;
          var style = document.createElement("style");
          style.id = "responsive-js-styles";
          style.textContent =
            "html.nav-locked, html.nav-locked body { overflow: hidden; height: 100%; }";
          document.head.appendChild(style);
        }

        /* ---------------------------------------------------------------
         * 4. Fade images in once loaded (works with .ph-img placeholders
         *    and any future <img> you add with loading="lazy").
         * ------------------------------------------------------------- */
        function markImagesLoaded(root) {
          var scope = root || document;
          var imgs = scope.querySelectorAll("img:not(.is-loaded)");
          imgs.forEach(function (img) {
            if (img.complete && img.naturalWidth > 0) {
              img.classList.add("is-loaded");
            } else {
              img.addEventListener(
                "load",
                function () {
                  img.classList.add("is-loaded");
                },
                { once: true },
              );
            }
          });
        }

        /* ---------------------------------------------------------------
         * 5. Responsive art-direction helper.
         *    Add data-src-mobile / data-src-tablet / data-src-desktop to
         *    any <img>, e.g.:
         *      <img class="ph-img" src="fallback.jpg"
         *           data-src-mobile="photo-480.jpg"
         *           data-src-tablet="photo-960.jpg"
         *           data-src-desktop="photo-1600.jpg">
         *    This will swap the correct one in automatically and keep it
         *    correct across resizes, so you don't have to touch JS again
         *    when you replace the placeholder graphics with real photos.
         * ------------------------------------------------------------- */
        function applyResponsiveImageSources(root) {
          var scope = root || document;
          var candidates = scope.querySelectorAll(
            "[data-src-mobile],[data-src-tablet],[data-src-desktop]",
          );
          if (!candidates.length) return;

          var w = window.innerWidth;
          var key =
            w <= BREAKPOINTS.mobile
              ? "srcMobile"
              : w <= BREAKPOINTS.tablet
                ? "srcTablet"
                : "srcDesktop";

          candidates.forEach(function (img) {
            var next = img.dataset[key];
            if (next && img.getAttribute("src") !== next) {
              img.classList.remove("is-loaded");
              img.src = next;
            }
          });
        }

        /* ---------------------------------------------------------------
         * 6. Auto-wrap wide tables/iframes for horizontal scroll instead
         *    of them blowing out the layout on small screens.
         * ------------------------------------------------------------- */
        function wrapOverflowElements(root) {
          var scope = root || document;
          scope.querySelectorAll("table, iframe").forEach(function (el) {
            if (el.closest("[data-responsive-scroll]")) return;
            var wrapper = document.createElement("div");
            wrapper.setAttribute("data-responsive-scroll", "");
            el.parentNode.insertBefore(wrapper, el);
            wrapper.appendChild(el);
          });
        }

        /* ---------------------------------------------------------------
         * Observe the SPA's #app container so anything the router injects
         * (new product/project cards, page content, etc.) automatically
         * gets the same treatment without a full page reload.
         * ------------------------------------------------------------- */
        function watchAppContainer() {
          var app = document.getElementById("app");
          if (!app || !("MutationObserver" in window)) return;
          var mo = new MutationObserver(
            debounce(function () {
              markImagesLoaded(app);
              applyResponsiveImageSources(app);
              wrapOverflowElements(app);
            }, 50),
          );
          mo.observe(app, { childList: true, subtree: true });
        }

        /* ---------------------------------------------------------------
         * Init
         * ------------------------------------------------------------- */
        function init() {
          injectScrollLockStyle();
          setViewportHeightVar();
          updateBreakpointClasses();
          markTouchDevice();
          enhanceMobileMenu();
          markImagesLoaded();
          applyResponsiveImageSources();
          wrapOverflowElements();
          watchAppContainer();

          var onResize = debounce(function () {
            setViewportHeightVar();
            updateBreakpointClasses();
            applyResponsiveImageSources();
          }, 120);

          window.addEventListener("resize", onResize);
          window.addEventListener("orientationchange", onResize);
        }

        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", init);
        } else {
          init();
        }
      })();
