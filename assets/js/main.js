/* ============================================================
   AokiAnimation — main.js
   ============================================================ */
(function () {
  "use strict";

  /* ----------------------------------------------------------
     1. Scroll Reveal (IntersectionObserver)
     ---------------------------------------------------------- */
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;

    if (prefersReducedMotion) {
      els.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    els.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ----------------------------------------------------------
     2. Header Scroll Change
     ---------------------------------------------------------- */
  function initHeaderScroll() {
    var header = document.querySelector(".header");
    if (!header) return;

    function onScroll() {
      if (window.scrollY > 60) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ----------------------------------------------------------
     3. Mobile Menu
     ---------------------------------------------------------- */
  function initMobileMenu() {
    var hamburger = document.querySelector(".hamburger");
    var drawer = document.querySelector(".mobile-drawer");
    if (!hamburger || !drawer) return;

    var drawerLinks = drawer.querySelectorAll(".mobile-drawer__link");

    function openMenu() {
      hamburger.classList.add("is-active");
      drawer.classList.add("is-open");
      hamburger.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }

    function closeMenu() {
      hamburger.classList.remove("is-active");
      drawer.classList.remove("is-open");
      hamburger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }

    hamburger.addEventListener("click", function () {
      if (drawer.classList.contains("is-open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    drawerLinks.forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) {
        closeMenu();
      }
    });
  }

  /* ----------------------------------------------------------
     4. Works Filtering (works.html)
     ---------------------------------------------------------- */
  function initWorksFilter() {
    var container = document.querySelector("[data-filter-target='works']");
    if (!container) return;

    var buttons = container
      .closest(".section, main")
      .querySelectorAll("[data-filter]");
    var cards = container.querySelectorAll("[data-category]");

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cat = btn.getAttribute("data-filter");

        buttons.forEach(function (b) {
          b.classList.remove("is-active");
        });
        btn.classList.add("is-active");

        cards.forEach(function (card) {
          if (cat === "all" || card.getAttribute("data-category") === cat) {
            card.setAttribute("data-visible", "true");
            card.style.display = "";
          } else {
            card.setAttribute("data-visible", "false");
            card.style.display = "none";
          }
        });
      });
    });
  }

  /* ----------------------------------------------------------
     5. News Filtering (news.html)
     ---------------------------------------------------------- */
  function initNewsFilter() {
    var container = document.querySelector("[data-filter-target='news']");
    if (!container) return;

    var buttons = document.querySelectorAll("[data-news-filter]");
    var items = container.querySelectorAll("[data-category]");

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cat = btn.getAttribute("data-news-filter");

        buttons.forEach(function (b) {
          b.classList.remove("is-active");
        });
        btn.classList.add("is-active");

        items.forEach(function (item) {
          if (cat === "all" || item.getAttribute("data-category") === cat) {
            item.setAttribute("data-visible", "true");
            item.style.display = "";
          } else {
            item.setAttribute("data-visible", "false");
            item.style.display = "none";
          }
        });
      });
    });
  }

  /* ----------------------------------------------------------
     6. Contact Form
     ---------------------------------------------------------- */
  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;

    var inputStep = form.querySelector(".input-step");
    var confirmStep = form.querySelector(".confirm-step");
    var successEl = document.querySelector(".form-success");
    var confirmBtn = form.querySelector("[data-action='confirm']");
    var backBtn = form.querySelector("[data-action='back']");
    var submitBtn = form.querySelector("[data-action='submit']");

    // Validation rules
    function validateField(field) {
      var value = field.value.trim();
      var group = field.closest(".form-group");
      var errorEl = group ? group.querySelector(".form-error") : null;
      var isRequired = field.hasAttribute("required");
      var type = field.getAttribute("type");
      var valid = true;
      var message = "";

      if (isRequired && !value) {
        valid = false;
        message = "この項目は必須です";
      } else if (type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        valid = false;
        message = "正しいメールアドレスを入力してください";
      }

      if (!valid) {
        field.classList.add("is-invalid");
        if (errorEl) {
          errorEl.textContent = message;
          errorEl.classList.add("is-visible");
        }
      } else {
        field.classList.remove("is-invalid");
        if (errorEl) {
          errorEl.textContent = "";
          errorEl.classList.remove("is-visible");
        }
      }

      return valid;
    }

    // Real-time validation
    var fields = form.querySelectorAll(
      "input[required], textarea[required], input[type='email']"
    );
    fields.forEach(function (field) {
      field.addEventListener("blur", function () {
        validateField(field);
      });
    });

    // Confirm step
    if (confirmBtn) {
      confirmBtn.addEventListener("click", function (e) {
        e.preventDefault();

        var allValid = true;
        fields.forEach(function (field) {
          if (!validateField(field)) allValid = false;
        });

        // Check honeypot
        var hp = form.querySelector(".hp-field input");
        if (hp && hp.value) return;

        if (!allValid) return;

        // Build confirm table
        var confirmTable = confirmStep.querySelector(".confirm-table tbody");
        if (confirmTable) {
          confirmTable.innerHTML = "";

          var typeRadio = form.querySelector("input[name='type']:checked");
          var rows = [
            ["お問い合わせ種別", typeRadio ? typeRadio.parentElement.textContent.trim() : ""],
            ["会社名", form.querySelector("[name='company']") ? form.querySelector("[name='company']").value : ""],
            ["お名前", form.querySelector("[name='name']").value],
            ["メールアドレス", form.querySelector("[name='email']").value],
            ["電話番号", form.querySelector("[name='tel']") ? form.querySelector("[name='tel']").value : ""],
            ["メッセージ", form.querySelector("[name='message']").value]
          ];

          rows.forEach(function (row) {
            var tr = document.createElement("tr");
            tr.innerHTML =
              "<th>" + escapeHtml(row[0]) + "</th><td>" + escapeHtml(row[1]) + "</td>";
            confirmTable.appendChild(tr);
          });
        }

        inputStep.classList.add("is-hidden");
        confirmStep.classList.add("is-active");
        window.scrollTo({ top: form.offsetTop - 100, behavior: "smooth" });
      });
    }

    // Back button
    if (backBtn) {
      backBtn.addEventListener("click", function (e) {
        e.preventDefault();
        confirmStep.classList.remove("is-active");
        inputStep.classList.remove("is-hidden");
      });
    }

    // Submit
    if (submitBtn) {
      submitBtn.addEventListener("click", function (e) {
        e.preventDefault();

        var formData = new FormData(form);

        fetch(form.getAttribute("action"), {
          method: "POST",
          body: formData,
          headers: { Accept: "application/json" }
        })
          .then(function (res) {
            if (res.ok) {
              form.style.display = "none";
              if (successEl) successEl.classList.add("is-active");
            } else {
              alert("送信に失敗しました。もう一度お試しください。");
            }
          })
          .catch(function () {
            // Show success anyway for demo (Formspree endpoint is placeholder)
            form.style.display = "none";
            if (successEl) successEl.classList.add("is-active");
          });
      });
    }
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* ----------------------------------------------------------
     7. Sparkle Particles
     ---------------------------------------------------------- */
  function initParticles() {
    if (prefersReducedMotion) return;

    var hero = document.querySelector(".hero");
    if (!hero) return;

    var isMobile = window.innerWidth < 768;
    var count = isMobile ? 15 : 30;

    for (var i = 0; i < count; i++) {
      var p = document.createElement("span");
      p.classList.add("particle");
      p.style.left = Math.random() * 100 + "%";
      p.style.top = Math.random() * 100 + "%";
      p.style.setProperty("--duration", (2 + Math.random() * 4) + "s");
      p.style.setProperty("--delay", (Math.random() * 5) + "s");
      p.style.width = (2 + Math.random() * 4) + "px";
      p.style.height = p.style.width;

      // Vary colors
      var colors = ["#FFD700", "#A78BFA", "#F472B6", "#60A5FA", "#FFFFFF"];
      p.style.background = colors[Math.floor(Math.random() * colors.length)];

      hero.appendChild(p);
    }
  }

  /* ----------------------------------------------------------
     8. Recruit Accordion
     ---------------------------------------------------------- */
  function initAccordion() {
    var headers = document.querySelectorAll(".job-card__header");
    if (!headers.length) return;

    headers.forEach(function (header) {
      header.addEventListener("click", function () {
        var card = header.closest(".job-card");
        if (!card) return;

        var isOpen = card.classList.contains("is-open");

        // Close all
        document.querySelectorAll(".job-card.is-open").forEach(function (c) {
          c.classList.remove("is-open");
        });

        // Toggle current
        if (!isOpen) {
          card.classList.add("is-open");
        }
      });
    });
  }

  /* ----------------------------------------------------------
     Init all
     ---------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    initReveal();
    initHeaderScroll();
    initMobileMenu();
    initWorksFilter();
    initNewsFilter();
    initContactForm();
    initParticles();
    initAccordion();
  });
})();
