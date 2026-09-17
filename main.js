/**
 * CheckPeps marketing site — the only script on the page.
 *
 * Two independent parts: the mobile nav toggle, and the motion layer below it.
 * Neither makes network calls, stores anything, or loads third-party code.
 * Adding any of those here means re-reviewing what data leaves the visitor's
 * browser.
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

/**
 * Motion layer: scroll reveals, the pinned statement, the flow trail, the hero
 * exit, card light, and the footer glow.
 *
 * Optional by construction. It does nothing under `prefers-reduced-motion:
 * reduce`, and every hidden starting state in styles.css is scoped under the
 * `.motion` class it adds to <html>. Without this script, every element renders
 * at full strength where it belongs.
 *
 * Its only outputs are classes and CSS custom properties, written through the
 * CSSOM (which the CSP permits; inline style attributes it does not). Scroll
 * work is batched into one animation frame, reads before writes, and only for
 * scenes near the viewport.
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;

  // `motion-init` holds transitions off while the page is tagged below; it is
  // lifted once that setup has been committed.
  root.classList.add("motion", "motion-init");

  // Turning reduced motion on mid-visit drops every effect at once: all of the
  // styling hangs off this class, and frame() stops writing without it.
  reducedMotion.addEventListener("change", function (event) {
    if (event.matches) root.classList.remove("motion");
  });

  function toArray(list) {
    return Array.prototype.slice.call(list);
  }

  function clamp01(value) {
    return value < 0 ? 0 : value > 1 ? 1 : value;
  }

  /* --- Scenes: effects driven by scroll position --------------------------- */

  var scenes = [];
  var framePending = false;
  var header = document.querySelector(".site-header");
  var headerHeight = 0;
  var headerStale = true;

  // Two passes, so a write made for one scene never forces a layout for the
  // next scene's read.
  function frame() {
    framePending = false;
    if (!root.classList.contains("motion")) return;

    var viewport = window.innerHeight;
    if (headerStale) {
      headerHeight = header ? header.getBoundingClientRect().height : 0;
      headerStale = false;
    }

    var due = scenes.filter(function (scene) {
      return scene.near || scene.settle;
    });
    var readings = due.map(function (scene) {
      return scene.read(viewport, headerHeight, scene);
    });

    due.forEach(function (scene, index) {
      scene.settle = false;
      scene.write(readings[index]);
    });
  }

  function schedule() {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(frame);
  }

  var proximity = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        scenes.forEach(function (scene) {
          if (scene.el !== entry.target) return;
          scene.near = entry.isIntersecting;
          // One more write on the way out, so a fast scroll cannot leave a
          // scene frozen part-way through.
          scene.settle = true;
        });
      });
      schedule();
    },
    { rootMargin: "20% 0px" }
  );

  function addScene(el, scene) {
    if (!el) return scene;
    scene.el = el;
    scene.near = false;
    scene.settle = true;
    scene.stale = true;
    scenes.push(scene);
    proximity.observe(el);
    return scene;
  }

  // Hero: --hero-exit runs 0 → 1 as the masthead scrolls up under the header.
  var hero = document.querySelector(".hero");

  addScene(hero, {
    read: function (viewport, headerOffset) {
      var box = hero.getBoundingClientRect();
      return clamp01((headerOffset - box.top) / box.height);
    },
    write: function (progress) {
      hero.style.setProperty("--hero-exit", progress.toFixed(4));
    }
  });

  // Statement: --statement-p runs 0 → 1 from the moment the block rises into
  // view until its runway ends; each word comes up at its own point along it.
  // Anyone asking for more contrast, or with forced colours, keeps plain text.
  var statement = document.querySelector(".statement");
  var statementText = statement && statement.querySelector(".statement__text");
  var plainText = window.matchMedia(
    "(prefers-contrast: more), (forced-colors: active)"
  );

  if (statementText && !plainText.matches) {
    var words = splitIntoWords(statementText);

    words.forEach(function (word, index) {
      var start = (index / Math.max(words.length - 1, 1)) * 0.62;
      word.style.setProperty("--w", start.toFixed(3));
    });

    var rail = document.createElement("span");
    rail.className = "statement__rail";
    rail.setAttribute("aria-hidden", "true");
    rail.appendChild(document.createElement("span"));
    statement.querySelector(".statement__stage").appendChild(rail);
    statement.classList.add("statement--live");

    addScene(statement, {
      read: function (viewport) {
        var box = statement.getBoundingClientRect();
        return clamp01(
          (viewport * 0.7 - box.top) / Math.max(box.height - viewport * 0.3, 1)
        );
      },
      write: function (progress) {
        statement.style.setProperty("--statement-p", progress.toFixed(4));
      }
    });
  }

  // The sentence is announced once, whole, from a visually hidden copy. The
  // split words are the visual layer only, so a screen reader never steps
  // through it one word at a time.
  function splitIntoWords(paragraph) {
    var visual = document.createElement("span");
    var words = [];

    visual.setAttribute("aria-hidden", "true");

    function split(source, target) {
      toArray(source.childNodes).forEach(function (node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          var copy = node.cloneNode(false);
          target.appendChild(copy);
          split(node, copy);
          return;
        }

        if (node.nodeType !== Node.TEXT_NODE) return;

        node.nodeValue.split(/(\s+)/).forEach(function (part) {
          if (!part) return;

          if (/^\s+$/.test(part)) {
            target.appendChild(document.createTextNode(" "));
            return;
          }

          var word = document.createElement("span");
          word.className = "statement__word";
          word.textContent = part;
          target.appendChild(word);
          words.push(word);
        });
      });
    }

    split(paragraph, visual);

    var spoken = document.createElement("span");
    spoken.className = "visually-hidden";
    spoken.textContent = paragraph.textContent.replace(/\s+/g, " ").trim();

    paragraph.textContent = "";
    paragraph.appendChild(spoken);
    paragraph.appendChild(visual);

    return words;
  }

  // Flow: a trail fills down the connectors as a reading line 62% of the way
  // down the viewport passes, and each step lights when the line reaches its
  // number. The trail is measured from the rendered numbers, so it follows any
  // reflow.
  var flow = document.querySelector(".flow-section .flow");
  var flowPanel = flow && flow.parentElement;

  if (flow && flowPanel) {
    var steps = toArray(flow.querySelectorAll(".flow__step"));
    var numbers = steps.map(function (step) {
      return step.querySelector(".flow__num");
    });
    var trail = document.createElement("span");
    var marks = null;

    trail.className = "flow__trail";
    trail.setAttribute("aria-hidden", "true");
    flowPanel.appendChild(trail);

    var flowScene = addScene(flowPanel, {
      read: function (viewport, headerOffset, scene) {
        var box = flowPanel.getBoundingClientRect();
        var measured = null;

        if (scene.stale || !marks) {
          measured = numbers.map(function (number) {
            var r = number.getBoundingClientRect();
            return {
              top: r.top - box.top,
              bottom: r.bottom - box.top,
              middle: r.top + r.height / 2 - box.top,
              centre: r.left + r.width / 2 - box.left
            };
          });
          scene.stale = false;
        }

        return { line: viewport * 0.62 - box.top, measured: measured };
      },
      write: function (reading) {
        if (reading.measured) {
          marks = reading.measured;
          var first = marks[0];
          var last = marks[marks.length - 1];
          trail.style.left = (first.centre - 1).toFixed(1) + "px";
          trail.style.top = first.bottom.toFixed(1) + "px";
          trail.style.height = Math.max(last.top - first.bottom, 0).toFixed(1) + "px";
        }

        var start = marks[0].bottom;
        var end = marks[marks.length - 1].top;
        var progress = clamp01((reading.line - start) / Math.max(end - start, 1));
        flowPanel.style.setProperty("--flow-p", progress.toFixed(4));

        steps.forEach(function (step, index) {
          var reached = reading.line >= marks[index].middle;
          if (step.classList.contains("is-reached") !== reached) {
            step.classList.toggle("is-reached", reached);
          }
        });
      }
    });

    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        flowScene.stale = true;
        flowScene.settle = true;
        schedule();
      }).observe(flow);
    }
  }

  // Footer: --footer-rise runs 0 → 1 as the footer comes fully into view.
  var footer = document.querySelector(".site-footer");

  addScene(footer, {
    read: function (viewport) {
      var box = footer.getBoundingClientRect();
      return clamp01((viewport - box.top) / box.height);
    },
    write: function (rise) {
      footer.style.setProperty("--footer-rise", rise.toFixed(4));
    }
  });

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", function () {
    headerStale = true;
    scenes.forEach(function (scene) {
      scene.stale = true;
      scene.settle = true;
    });
    schedule();
  });

  schedule();

  /* --- Reveals --------------------------------------------------------------- */

  // Set up after the statement goes live, because its runway moves everything
  // below it and the fold test needs final positions.
  var revealables = toArray(
    document.querySelectorAll(
      [
        ".section__head > *",
        ".grid > .card",
        ".steps > .step",
        ".split > .panel",
        ".flow-section .hero__panel",
        ".section .callout",
        ".cta > *"
      ].join(", ")
    )
  ).filter(function (el) {
    return !el.closest(".hero, .statement, .doc");
  });

  var revealer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) reveal(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px" }
  );

  function reveal(el) {
    el.classList.add("is-revealed");
    revealer.unobserve(el);
  }

  // Every position is read before anything is tagged. Targets already on
  // screen, or scrolled past, are revealed in the same task that hides them,
  // so they never flash out.
  var fold = window.innerHeight * 0.92;
  var seen = revealables.map(function (el) {
    return el.getBoundingClientRect().top < fold;
  });
  var siblingsSoFar = new Map();

  revealables.forEach(function (el, index) {
    var order = siblingsSoFar.get(el.parentElement) || 0;
    siblingsSoFar.set(el.parentElement, order + 1);

    if (order) {
      el.style.setProperty("--reveal-delay", Math.min(order, 5) * 90 + "ms");
    }

    el.classList.add("reveal");

    if (seen[index]) {
      el.classList.add("is-revealed");
    } else {
      revealer.observe(el);
    }
  });

  // The page may already have been styled once before this ran. Commit the
  // hidden states in a style pass with transitions still off, or every target
  // below the fold would fade *out* on load; then hand transitions back.
  void root.offsetHeight;
  root.classList.remove("motion-init");

  // Keyboard focus can land inside a block before it has scrolled into view.
  document.addEventListener("focusin", function (event) {
    var hidden = event.target.closest(".reveal:not(.is-revealed)");
    if (hidden) reveal(hidden);
  });

  /* --- Card light ------------------------------------------------------------ */

  // Hover-capable pointers only: on touch there is no hover to answer.
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    toArray(document.querySelectorAll(".grid > .card, .steps > .step")).forEach(
      addLight
    );
  }

  function addLight(card) {
    var pointerX = 0;
    var pointerY = 0;
    var pending = 0;

    // The corner under the pointer comes forward: positive rotateX brings the
    // bottom edge toward the reader, positive rotateY pushes the right edge away.
    function paint() {
      pending = 0;
      var box = card.getBoundingClientRect();
      var x = clamp01((pointerX - box.left) / box.width);
      var y = clamp01((pointerY - box.top) / box.height);
      card.style.setProperty("--tilt-x", ((y - 0.5) * 6).toFixed(2) + "deg");
      card.style.setProperty("--tilt-y", ((0.5 - x) * 6).toFixed(2) + "deg");
      card.style.setProperty("--glow-x", (x * 100).toFixed(1) + "%");
      card.style.setProperty("--glow-y", (y * 100).toFixed(1) + "%");
    }

    card.classList.add("tilt");

    card.addEventListener("pointermove", function (event) {
      if (event.pointerType === "touch") return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!pending) pending = window.requestAnimationFrame(paint);
    });

    card.addEventListener("pointerleave", function () {
      if (pending) window.cancelAnimationFrame(pending);
      pending = 0;
      card.style.removeProperty("--tilt-x");
      card.style.removeProperty("--tilt-y");
    });
  }
})();
