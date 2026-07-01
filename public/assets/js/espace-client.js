(function () {
  const titleNode = document.getElementById("client-space-title");
  const metaNode = document.getElementById("client-space-meta");
  const loadingState = document.getElementById("client-space-loading");
  const errorState = document.getElementById("client-space-error");
  const errorMessage = document.getElementById("client-space-error-message");
  const contentState = document.getElementById("client-space-content");
  const summaryCouple = document.getElementById("summary-couple");
  const summaryDate = document.getElementById("summary-date");
  const summaryCount = document.getElementById("summary-count");
  const tablesGrid = document.getElementById("tables-grid");
  const revealNodes = document.querySelectorAll("[data-reveal]");
  const sectionAnchors = document.querySelectorAll('a[href^="#"]');

  function resolveKey() {
    const url = new URL(window.location.href);
    const queryKey = url.searchParams.get("key") || url.searchParams.get("code");

    if (queryKey) {
      return queryKey;
    }

    const parts = window.location.pathname.split("/").filter(Boolean);
    const clientSpaceIndex = parts.indexOf("espace-client");

    if (clientSpaceIndex !== -1 && parts[clientSpaceIndex + 1]) {
      return decodeURIComponent(parts[clientSpaceIndex + 1]);
    }

    if (window.HopeEventsDemo && window.HopeEventsDemo.getEventSpace) {
      return "HE-CLSM-2026";
    }

    return "";
  }

  function initReveal() {
    if (!("IntersectionObserver" in window) || !revealNodes.length) {
      revealNodes.forEach(function (node) {
        node.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.14
      }
    );

    revealNodes.forEach(function (node) {
      observer.observe(node);
    });
  }

  function initSectionAnchors() {
    if (!sectionAnchors.length) {
      return;
    }

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

    sectionAnchors.forEach(function (anchor) {
      anchor.addEventListener("click", function (event) {
        const hash = anchor.getAttribute("href");

        if (!hash || hash === "#") {
          return;
        }

        const target = document.querySelector(hash);

        if (!target) {
          return;
        }

        event.preventDefault();
        target.scrollIntoView({
          behavior: motionPreference.matches ? "auto" : "smooth",
          block: "start"
        });

        if (window.history && typeof window.history.replaceState === "function") {
          window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
        }
      });
    });
  }

  function setHidden(element, hidden) {
    if (!element) {
      return;
    }

    element.classList.toggle("is-hidden", hidden);
  }

  function showError(message) {
    setHidden(loadingState, true);
    setHidden(contentState, true);
    setHidden(errorState, false);

    if (errorMessage) {
      errorMessage.textContent = message;
    }
  }

  function groupByTable(invitations) {
    return (invitations || []).reduce(function (accumulator, invitation) {
      const tableName = invitation.tableName || "Sans table";

      if (!accumulator[tableName]) {
        accumulator[tableName] = [];
      }

      accumulator[tableName].push(invitation);
      return accumulator;
    }, {});
  }

  function renderTables(invitations) {
    if (!tablesGrid) {
      return;
    }

    const groups = groupByTable(invitations);
    const groupEntries = Object.keys(groups).sort(function (a, b) {
      return a.localeCompare(b, "fr", { sensitivity: "base" });
    });

    tablesGrid.innerHTML = groupEntries
      .map(function (tableName) {
        const rows = groups[tableName]
          .map(function (invitation) {
            return `
              <li class="guest-row">
                <div>
                  <strong>${invitation.guestName}</strong>
                  <span>${invitation.seats} place${invitation.seats > 1 ? "s" : ""}</span>
                </div>
                <a class="guest-link" href="${invitation.invitationUrl}">Ouvrir</a>
              </li>
            `;
          })
          .join("");

        return `
          <article class="table-card">
            <div class="table-card-head">
              <span class="table-chip">${tableName}</span>
              <strong>${groups[tableName].length} invite${groups[tableName].length > 1 ? "s" : ""}</strong>
            </div>
            <ul class="guest-list">
              ${rows}
            </ul>
          </article>
        `;
      })
      .join("");
  }

  function hydrateSpace(space) {
    document.title = `Espace client | ${space.coupleNames}`;

    if (titleNode) {
      titleNode.textContent = space.coupleNames || "Espace client";
    }

    if (metaNode) {
      metaNode.textContent = [
        space.dateLabel || "Date a confirmer",
        space.venueName || "Lieu a confirmer"
      ]
        .filter(Boolean)
        .join(" • ");
    }

    if (summaryCouple) {
      summaryCouple.textContent = space.coupleNames || "-";
    }

    if (summaryDate) {
      summaryDate.textContent = space.dateLabel || "-";
    }

    if (summaryCount) {
      summaryCount.textContent = String((space.invitations || []).length);
    }

    renderTables(space.invitations || []);
    setHidden(loadingState, true);
    setHidden(errorState, true);
    setHidden(contentState, false);
  }

  async function init() {
    initSectionAnchors();
    initReveal();

    const key = resolveKey();

    if (!key) {
      showError("Aucun code evenement n'a ete detecte.");
      return;
    }

    if (!window.HopeEventsApi || typeof window.HopeEventsApi.getEventSpace !== "function") {
      showError("Le module d'acces prive n'est pas disponible.");
      return;
    }

    try {
      const payload = await window.HopeEventsApi.getEventSpace(key);

      if (!payload || !payload.data) {
        showError("Cet espace client est introuvable.");
        return;
      }

      hydrateSpace(payload.data);
    } catch (error) {
      showError(error.message || "Impossible de charger cet espace client.");
    }
  }

  init();
})();
