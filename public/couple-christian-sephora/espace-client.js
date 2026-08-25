(function () {
  const pageConfig = window.HopeEventsPageConfig || {};
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

  function isFileMode() {
    return window.location.protocol === "file:";
  }

  function resolveKey() {
    const url = new URL(window.location.href);
    const queryKey = url.searchParams.get("key") || url.searchParams.get("code");
    const aliases = pageConfig.accessAliases || {};

    function normalize(input) {
      const normalized = String(input || "")
        .trim()
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .toUpperCase();

      return aliases[normalized] || aliases[input] || normalized;
    }

    if (queryKey) {
      return normalize(queryKey);
    }

    return normalize(pageConfig.defaultKey || "HE-CSM-2026");
  }

  function buildLocalPageUrl(pagePath, token) {
    const separator = pagePath.indexOf("?") === -1 ? "?" : "&";
    return `${pagePath}${separator}token=${encodeURIComponent(token || "")}`;
  }

  function getGuestRoute(invitation) {
    const routes = pageConfig.guestRoutes || {};
    const generatedRoutes = window.HopeEventsGuestDirectory || {};
    return routes[invitation.token] || generatedRoutes[invitation.token] || {};
  }

  function buildPublicInvitationUrl(token) {
    const guestRoute = (pageConfig.guestRoutes || {})[token] || {};
    const publicPath = String(
      guestRoute.publicInvitationPath || pageConfig.publicInvitationPath || ""
    ).trim();
    const normalizedPath = publicPath.startsWith("/") ? publicPath : `/${publicPath}`;

    if (!isFileMode()) {
      return `${window.location.origin}${normalizedPath}?token=${encodeURIComponent(token || "")}`;
    }

    const publicBaseUrl = String(pageConfig.publicBaseUrl || "https://hope-events.vercel.app").trim().replace(/\/+$/, "");
    return `${publicBaseUrl}${normalizedPath}?token=${encodeURIComponent(token || "")}`;
  }

  function buildInvitationUrl(invitation) {
    const guestRoute = getGuestRoute(invitation);
    const invitationPath = String(
      guestRoute.invitationPagePath || invitation.invitationPagePath || ""
    ).trim();

    if (invitationPath) {
      return buildLocalPageUrl(invitationPath, invitation.token);
    }

    const fallbackQrPath = String(invitation.qrPagePath || guestRoute.qrPagePath || "").trim();

    if (fallbackQrPath) {
      return buildLocalPageUrl(fallbackQrPath.replace(/qr-code[^/]*\.html?$/i, "invitation.html"), invitation.token);
    }

    return buildLocalPageUrl("./Table amour/couple-kuanzambi/invitation.html", invitation.token);
  }

  function buildQrCardUrl(invitation) {
    const guestRoute = getGuestRoute(invitation);
    const customPath = String(invitation.qrPagePath || "").trim();

    if (customPath) {
      return buildLocalPageUrl(customPath, invitation.token);
    }

    if (guestRoute.qrPagePath) {
      return buildLocalPageUrl(guestRoute.qrPagePath, invitation.token);
    }

    return buildLocalPageUrl("./Table amour/couple-kuanzambi/qr-code-couple-kuanzambi.html", invitation.token);
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
      { threshold: 0.14 }
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
      });
    });
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
    const entries = Object.keys(groups).sort(function (a, b) {
      return a.localeCompare(b, "fr", { sensitivity: "base" });
    });

    tablesGrid.innerHTML = entries
      .map(function (tableName) {
        const rows = groups[tableName]
          .map(function (invitation) {
            const invitationUrl = buildInvitationUrl(invitation);
            const qrCardUrl = buildQrCardUrl(invitation);
            const publicLink = buildPublicInvitationUrl(invitation.token);

            return `
              <li class="guest-row guest-row-rich">
                <div class="guest-info">
                  <strong>${invitation.guestName}</strong>
                  <span>${invitation.seats} place${invitation.seats > 1 ? "s" : ""}</span>
                </div>
                <div class="guest-actions">
                  <a class="guest-link" href="${invitationUrl}">Invitation</a>
                  <a class="guest-link guest-link-alt" href="${qrCardUrl}">Page QR</a>
                  <button class="guest-link guest-link-copy" type="button" data-copy-link="${publicLink}">
                    Copier le lien
                  </button>
                </div>
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

  function initCopyButtons() {
    if (!tablesGrid) {
      return;
    }

    tablesGrid.addEventListener("click", async function (event) {
      const trigger = event.target.closest("[data-copy-link]");

      if (!trigger) {
        return;
      }

      const link = trigger.getAttribute("data-copy-link");

      if (!link) {
        return;
      }

      try {
        await navigator.clipboard.writeText(link);
        const previousLabel = trigger.textContent;
        trigger.textContent = "Lien copie";

        window.setTimeout(function () {
          trigger.textContent = previousLabel;
        }, 1600);
      } catch (error) {
        window.alert(link);
      }
    });
  }

  function hydrateSpace(space) {
    document.title = `Espace client | ${space.coupleNames || "Hope Events"}`;

    if (titleNode) {
      titleNode.textContent = space.coupleNames || "Espace client";
    }

    if (metaNode) {
      metaNode.textContent = [space.dateLabel || "Date a confirmer", space.venueName || "Lieu a confirmer"]
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
    initReveal();
    initSectionAnchors();
    initCopyButtons();

    const key = resolveKey();

    if (!key) {
      showError("Aucun code evenement n'a ete detecte.");
      return;
    }

    if (!window.HopeEventsApi || typeof window.HopeEventsApi.getEventSpace !== "function") {
      showError("Le module d'acces client n'est pas disponible.");
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
