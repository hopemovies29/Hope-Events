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
  const reportsSummary = document.getElementById("reports-summary");
  const rsvpReport = document.getElementById("rsvp-report");
  const preferencesReport = document.getElementById("preferences-report");
  const messagesReport = document.getElementById("messages-report");
  const reportsStatus = document.getElementById("reports-status");
  const reportsRefresh = document.getElementById("reports-refresh");
  const guestSearch = document.getElementById("guest-search");
  const tableFilter = document.getElementById("table-filter");
  const selectVisible = document.getElementById("select-visible");
  const selectedCount = document.getElementById("selected-count");
  const bulkCopyMessages = document.getElementById("bulk-copy-messages");
  const bulkWhatsapp = document.getElementById("bulk-whatsapp");
  const bulkHelper = document.getElementById("bulk-helper");
  const revealNodes = document.querySelectorAll("[data-reveal]");
  const sectionAnchors = document.querySelectorAll('a[href^="#"]');
  let currentInvitations = [];
  const selectedTokens = new Set();

  function isFileMode() {
    return window.location.protocol === "file:";
  }

  function resolveKey() {
    const url = new URL(window.location.href);
    const queryKey = url.searchParams.get("key") || url.searchParams.get("code");
    function normalize(input) {
      return String(input || "").trim();
    }

    if (queryKey) {
      window.sessionStorage.setItem("hope-events-client-code", normalize(queryKey));
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return normalize(queryKey || window.sessionStorage.getItem("hope-events-client-code"));
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
    if (!isFileMode()) {
      return `${window.location.origin}/?token=${encodeURIComponent(token || "")}`;
    }

    const publicBaseUrl = String(pageConfig.publicBaseUrl || "https://hope-events.vercel.app").trim().replace(/\/+$/, "");
    return `${publicBaseUrl}/?token=${encodeURIComponent(token || "")}`;
  }

  function buildWhatsAppShareUrl(invitation, publicLink) {
    return `https://wa.me/?text=${encodeURIComponent(buildWhatsAppMessage(invitation, publicLink))}`;
  }

  function buildWhatsAppMessage(invitation, publicLink) {
    const guestName = String(invitation.guestName || "cher invite").trim();
    const message = [
      "Mariage : Christian & Sephora",
      "",
      `Bonjour ${guestName},`,
      "",
      "Votre presence sera pour nous un honneur et rendra cette journee encore plus memorable.",
      "",
      "Cliquez sur le lien ci-dessous pour visualiser votre invitation personnelle.",
      "",
      publicLink
    ].join("\n");

    return message;
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

  function getFilteredInvitations(invitations) {
    const search = String(guestSearch && guestSearch.value || "").trim().toLocaleLowerCase("fr");
    const table = String(tableFilter && tableFilter.value || "");
    return invitations.filter(function (invitation) {
      const matchesSearch = !search || `${invitation.guestName} ${invitation.tableName}`.toLocaleLowerCase("fr").includes(search);
      return matchesSearch && (!table || invitation.tableName === table);
    });
  }

  function renderBulkState(visibleInvitations) {
    const count = selectedTokens.size;
    if (selectedCount) selectedCount.textContent = `${count} sélection${count > 1 ? "s" : ""}`;
    if (bulkCopyMessages) bulkCopyMessages.disabled = count === 0;
    if (bulkWhatsapp) bulkWhatsapp.disabled = count === 0;
    if (selectVisible) {
      const visibleTokens = visibleInvitations.map(function (item) { return item.token; });
      selectVisible.checked = visibleTokens.length > 0 && visibleTokens.every(function (token) { return selectedTokens.has(token); });
      selectVisible.indeterminate = !selectVisible.checked && visibleTokens.some(function (token) { return selectedTokens.has(token); });
    }
  }

  function renderTables(invitations) {
    if (!tablesGrid) {
      return;
    }

    const filteredInvitations = getFilteredInvitations(invitations);
    const groups = groupByTable(filteredInvitations);
    const entries = Object.keys(groups).sort(function (a, b) {
      return a.localeCompare(b, "fr", { sensitivity: "base" });
    });

    tablesGrid.innerHTML = entries
      .map(function (tableName) {
        const scans = groups[tableName].reduce(function (total, invitation) {
          return total + Number(invitation.viewCount || 0);
        }, 0);
        const rows = groups[tableName]
          .map(function (invitation) {
            const invitationUrl = buildInvitationUrl(invitation);
            const qrCardUrl = buildQrCardUrl(invitation);
            const publicLink = buildPublicInvitationUrl(invitation.token);
            const whatsappUrl = buildWhatsAppShareUrl(invitation, publicLink);

            return `
              <li class="guest-row guest-row-rich">
                <div class="guest-info">
                  <strong>${escapeHtml(invitation.guestName)}</strong>
                  <span>${invitation.seats} place${invitation.seats > 1 ? "s" : ""}</span>
                </div>
                <div class="guest-actions">
                  <label class="guest-select"><input type="checkbox" data-select-token="${escapeHtml(invitation.token)}" ${selectedTokens.has(invitation.token) ? "checked" : ""} /> Sélectionner</label>
                  <a class="guest-link" href="${invitationUrl}">Invitation</a>
                  <a class="guest-link guest-link-alt" href="${qrCardUrl}">Page QR</a>
                  <a class="guest-link guest-link-whatsapp" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer">
                    Envoyer WhatsApp
                  </a>
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
              <strong>${groups[tableName].length} invite${groups[tableName].length > 1 ? "s" : ""} · ${scans} ouverture${scans > 1 ? "s" : ""}</strong>
            </div>
            <ul class="guest-list">
              ${rows}
            </ul>
          </article>
        `;
      })
      .join("");

    if (!tablesGrid.innerHTML) {
      tablesGrid.innerHTML = '<p class="client-space-helper">Aucune invitation ne correspond à cette recherche.</p>';
    }
    renderBulkState(filteredInvitations);
  }

  function syncTableFilter(invitations) {
    if (!tableFilter) return;
    const selected = tableFilter.value;
    const tables = Array.from(new Set(invitations.map(function (item) { return item.tableName; }))).sort(function (a, b) {
      return a.localeCompare(b, "fr", { sensitivity: "base" });
    });
    tableFilter.innerHTML = '<option value="">Toutes les tables</option>' + tables.map(function (table) {
      return `<option value="${escapeHtml(table)}">${escapeHtml(table)}</option>`;
    }).join("");
    tableFilter.value = tables.includes(selected) ? selected : "";
  }

  function getSelectedInvitations() {
    return currentInvitations.filter(function (invitation) { return selectedTokens.has(invitation.token); });
  }

  function initInvitationTools() {
    [guestSearch, tableFilter].filter(Boolean).forEach(function (control) {
      control.addEventListener("input", function () { renderTables(currentInvitations); });
      control.addEventListener("change", function () { renderTables(currentInvitations); });
    });

    if (selectVisible) {
      selectVisible.addEventListener("change", function () {
        getFilteredInvitations(currentInvitations).forEach(function (invitation) {
          if (selectVisible.checked) selectedTokens.add(invitation.token);
          else selectedTokens.delete(invitation.token);
        });
        renderTables(currentInvitations);
      });
    }

    if (bulkCopyMessages) {
      bulkCopyMessages.addEventListener("click", async function () {
        const messages = getSelectedInvitations().map(function (invitation) {
          return buildWhatsAppMessage(invitation, buildPublicInvitationUrl(invitation.token));
        }).join("\n\n--------------------\n\n");
        try {
          await navigator.clipboard.writeText(messages);
          if (bulkHelper) bulkHelper.textContent = `${getSelectedInvitations().length} message(s) copié(s). Collez-en un dans WhatsApp pour chaque invité.`;
        } catch (error) {
          window.prompt("Copiez les messages préparés :", messages);
        }
      });
    }

    if (bulkWhatsapp) {
      bulkWhatsapp.addEventListener("click", function () {
        const invitations = getSelectedInvitations();
        if (!invitations.length) return;
        window.open(buildWhatsAppShareUrl(invitations[0], buildPublicInvitationUrl(invitations[0].token)), "_blank", "noopener");
        if (bulkHelper) bulkHelper.textContent = `Premier message ouvert dans WhatsApp. ${invitations.length - 1} autre(s) message(s) restent prêts à copier.`;
      });
    }
  }

  function initCopyButtons() {
    if (!tablesGrid) {
      return;
    }

    tablesGrid.addEventListener("click", async function (event) {
      const checkbox = event.target.closest("[data-select-token]");
      if (checkbox) {
        if (checkbox.checked) selectedTokens.add(checkbox.getAttribute("data-select-token"));
        else selectedTokens.delete(checkbox.getAttribute("data-select-token"));
        renderBulkState(getFilteredInvitations(currentInvitations));
        return;
      }
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

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'\"]/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
      }[character];
    });
  }

  function emptyReport(message) {
    return `<p class="report-empty">${escapeHtml(message)}</p>`;
  }

  function attendanceLabel(value) {
    return {
      oui: "Present",
      "peut-etre": "Peut-etre",
      non: "Absent"
    }[value] || "Sans reponse";
  }

  function sortNewest(items) {
    return (items || []).slice().sort(function (left, right) {
      return new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime();
    });
  }

  function formatUpdate(value) {
    if (!value) {
      return "Reponse recue";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Reponse recue";
    }

    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function renderReports(reportData) {
    if (!reportsSummary || !rsvpReport || !preferencesReport || !messagesReport) {
      return;
    }

    const summary = reportData.summary || {};
    const rsvps = sortNewest(reportData.rsvps);
    const preferences = sortNewest(reportData.preferences);
    const messages = sortNewest(reportData.messages);
    const stats = [
      ["Confirmes", summary.confirmed || 0],
      ["Peut-etre", summary.maybe || 0],
      ["Accompagnants", summary.companions || 0],
      ["Messages", summary.messageCount || 0]
    ];

    reportsSummary.innerHTML = stats.map(function (stat) {
      return `<article class="report-stat"><span>${stat[0]}</span><strong>${stat[1]}</strong></article>`;
    }).join("");

    rsvpReport.innerHTML = rsvps.length ? `<ul class="report-list report-list-scroll">${rsvps.map(function (item) {
      const companionText = Number(item.companions || 0) ? ` + ${item.companions} accompagnant${Number(item.companions) > 1 ? "s" : ""}` : "";
      return `<li class="report-line"><div class="report-person"><strong>${escapeHtml(item.guestName)}</strong><span>${escapeHtml(item.tableName)} · ${formatUpdate(item.updatedAt)}</span></div><strong class="report-badge report-badge-${escapeHtml(item.attendance)}">${attendanceLabel(item.attendance)}${companionText}</strong></li>`;
    }).join("")}</ul>` : emptyReport("Aucune confirmation recue pour le moment.");

    preferencesReport.innerHTML = preferences.length ? `<ul class="report-list report-list-scroll">${preferences.map(function (item) {
      return `<li class="report-line"><div class="report-person"><strong>${escapeHtml(item.guestName)}</strong><span>${escapeHtml(item.tableName)} · ${formatUpdate(item.updatedAt)}</span></div><strong class="drink-answer">${escapeHtml((item.choices || []).join(", "))}</strong></li>`;
    }).join("")}</ul>` : emptyReport("Aucun choix de boisson recu pour le moment.");

    messagesReport.innerHTML = messages.length ? `<ul class="report-list report-list-scroll report-message-list">${messages.map(function (item) {
      return `<li class="report-message-entry"><div class="report-message-head"><strong>${escapeHtml(item.author || item.guestName)}</strong><span>${escapeHtml(item.tableName)} · ${formatUpdate(item.updatedAt)}</span></div><p class="report-message">${escapeHtml(item.message)}</p></li>`;
    }).join("")}</ul>` : emptyReport("Les premiers mots doux des invites apparaitront ici.");

    if (reportsStatus) {
      reportsStatus.textContent = `${summary.totalResponses || 0} reponse${Number(summary.totalResponses || 0) > 1 ? "s" : ""} de presence · ${summary.preferencesCount || 0} choix de boissons · ${summary.messageCount || 0} message${Number(summary.messageCount || 0) > 1 ? "s" : ""}`;
    }
  }

  async function loadReports(key) {
    if (!window.HopeEventsApi || typeof window.HopeEventsApi.getEventReports !== "function") {
      return;
    }

    try {
      if (reportsRefresh) {
        reportsRefresh.disabled = true;
        reportsRefresh.textContent = "Actualisation...";
      }
      const payload = await window.HopeEventsApi.getEventReports(key, pageConfig.eventId);
      if (payload && payload.data) {
        renderReports(payload.data);
      }
    } catch (error) {
      if (rsvpReport) {
        rsvpReport.innerHTML = emptyReport("Le suivi sera disponible des que Firebase aura reçu les premieres reponses.");
      }
      if (preferencesReport) {
        preferencesReport.innerHTML = emptyReport("Les choix de boissons apparaitront ici.");
      }
      if (messagesReport) {
        messagesReport.innerHTML = emptyReport("Les messages des invités apparaitront ici.");
      }
      if (reportsStatus) {
        reportsStatus.textContent = "Impossible d'actualiser le suivi pour le moment.";
      }
    } finally {
      if (reportsRefresh) {
        reportsRefresh.disabled = false;
        reportsRefresh.textContent = "Actualiser le suivi";
      }
    }
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

    currentInvitations = space.invitations || [];
    Array.from(selectedTokens).forEach(function (token) {
      if (!currentInvitations.some(function (invitation) { return invitation.token === token; })) selectedTokens.delete(token);
    });
    syncTableFilter(currentInvitations);
    renderTables(currentInvitations);
    setHidden(loadingState, true);
    setHidden(errorState, true);
    setHidden(contentState, false);

    // The table section starts hidden for its reveal animation. It is mounted
    // after the observer starts, so reveal it once the event data is ready.
    contentState.querySelectorAll("[data-reveal]").forEach(function (node) {
      node.classList.add("is-visible");
    });
  }

  async function init() {
    initReveal();
    initSectionAnchors();
    initCopyButtons();
    initInvitationTools();

    const key = resolveKey();

    if (reportsRefresh) {
      reportsRefresh.addEventListener("click", function () {
        loadReports(key);
      });
    }

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
      await loadReports(key);
    } catch (error) {
      showError(error.message || "Impossible de charger cet espace client.");
    }
  }

  init();
})();
