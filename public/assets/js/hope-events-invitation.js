(function () {
  function resolveToken() {
    const url = new URL(window.location.href);
    const queryToken = url.searchParams.get("token") || url.searchParams.get("code");

    if (queryToken) {
      return queryToken;
    }

    const parts = window.location.pathname.split("/").filter(Boolean);
    const invitationIndex = parts.indexOf("invitation");

    if (invitationIndex !== -1 && parts[invitationIndex + 1]) {
      return decodeURIComponent(parts[invitationIndex + 1]);
    }

    if (window.HopeEventsDemo && window.HopeEventsDemo.defaultToken) {
      return window.HopeEventsDemo.defaultToken;
    }

    return "";
  }

  function resolveAssetPath(path) {
    if (!path) {
      return "";
    }

    if (window.location.protocol === "file:" && path.startsWith("/")) {
      return "." + path;
    }

    return path;
  }

  function slugify(value) {
    return (value || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function extractExtension(path) {
    const cleanPath = (path || "").split("?")[0];
    const match = cleanPath.match(/\.([a-z0-9]+)$/i);
    return match ? match[1].toLowerCase() : "jpg";
  }

  function initInvitationMedia() {
    const stage = document.querySelector(".message-stage");
    const messageImage = document.getElementById("messageImage");

    if (!stage || !messageImage) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const imagePath = params.get("card") || stage.dataset.messageImage || messageImage.getAttribute("src");
    const invitee = params.get("invitee") || stage.dataset.invitee || "";
    const table = params.get("table") || stage.dataset.table || "";
    const explicitExportName = params.get("file") || stage.dataset.exportName || "";
    const computedExportName = explicitExportName || [invitee, table]
      .map(slugify)
      .filter(Boolean)
      .join("-");

    messageImage.src = resolveAssetPath(imagePath);
    messageImage.alt = invitee
      ? `Invitation personnalisee Hope Events pour ${invitee}${table ? ` - table ${table}` : ""}`
      : "Invitation personnalisee Hope Events";

    stage.dataset.messageImage = resolveAssetPath(imagePath);
    stage.dataset.exportName = computedExportName || "hope-events-invitation";
  }

  function applyInvitationRecord(invitation) {
    const stage = document.querySelector(".message-stage");
    const messageImage = document.getElementById("messageImage");
    const mapButton = document.querySelector('a[href*="maps.google.com"]');
    const whatsappLink = document.getElementById("whatsapp-link") || document.querySelector(".whatsapp-link");

    if (!stage || !messageImage || !invitation) {
      return;
    }

    const invitee = invitation.guestName || stage.dataset.invitee || "";
    const table = invitation.tableName || stage.dataset.table || "";
    const exportName = invitation.exportName || invitation.token || "";
    const invitationImage = resolveAssetPath(
      invitation.invitationImage || stage.dataset.messageImage || messageImage.getAttribute("src")
    );

    messageImage.src = invitationImage;
    messageImage.alt = invitee
      ? `Invitation personnalisee Hope Events pour ${invitee}${table ? ` - ${table}` : ""}`
      : "Invitation personnalisee Hope Events";

    stage.dataset.messageImage = invitationImage;
    stage.dataset.invitee = invitee;
    stage.dataset.table = table;
    stage.dataset.exportName = exportName || stage.dataset.exportName || "hope-events-invitation";

    if (mapButton && invitation.mapUrl) {
      mapButton.href = invitation.mapUrl;
    }

    if (whatsappLink && invitation.whatsappLink) {
      whatsappLink.href = invitation.whatsappLink;
    }

    if (invitation.coupleNames && invitee) {
      document.title = `Invitation | ${invitation.coupleNames} | ${invitee}`;
    }
  }

  async function hydrateInvitationFromApi() {
    const token = resolveToken();

    if (!token || !window.HopeEventsApi || typeof window.HopeEventsApi.getInvitation !== "function") {
      return;
    }

    try {
      const payload = await window.HopeEventsApi.getInvitation(token);

      if (!payload || !payload.data) {
        return;
      }

      applyInvitationRecord(payload.data);

      if (typeof window.HopeEventsApi.recordView === "function") {
        window.HopeEventsApi.recordView(payload.data.token || token).catch(function () {
          return null;
        });
      }
    } catch (error) {
      window.console.warn("Impossible de charger l'invitation dynamique.", error);
    }
  }

  function initHearts() {
    const container = document.querySelector(".coeur");

    if (!container) {
      return;
    }

    const heartCount = 9;

    for (let index = 0; index < heartCount; index += 1) {
      const heart = document.createElement("div");
      heart.className = "heart";
      heart.textContent = "♥";
      heart.style.left = `${Math.random() * 100}%`;
      heart.style.animationDelay = `${Math.random() * 8}s`;
      heart.style.animationDuration = `${9 + Math.random() * 5}s`;
      container.appendChild(heart);
    }
  }

  function initDownload() {
    const downloadButton = document.getElementById("downloadButton");
    const stage = document.querySelector(".message-stage");
    const messageImage = document.getElementById("messageImage");

    if (!downloadButton || !stage || !messageImage) {
      return;
    }

    downloadButton.addEventListener("click", function () {
      const imagePath = stage.dataset.messageImage || messageImage.currentSrc || messageImage.src;
      const exportName = stage.dataset.exportName || "hope-events-invitation";
      const extension = extractExtension(imagePath);
      const link = document.createElement("a");

      link.download = `${exportName}.${extension}`;
      link.href = imagePath;
      link.click();
    });
  }

  function initGuestbook() {
    const form = document.getElementById("guestbook-form");

    if (!form) {
      return;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      window.alert("Votre message a bien ete enregistre localement. Signature Dr Tech.");
    });
  }

  function initPreferences() {
    const buttons = Array.from(document.querySelectorAll(".product-button"));
    const submitButton = document.getElementById("submitButton");
    const submitAction = document.getElementById("preferences-submit");

    if (!buttons.length || !submitButton) {
      return;
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        if (button.classList.contains("active")) {
          button.classList.remove("active");
        } else {
          const activeButtons = buttons.filter(function (item) {
            return item.classList.contains("active");
          });

          if (activeButtons.length >= 2) {
            activeButtons[0].classList.remove("active");
          }

          button.classList.add("active");
        }

        const hasActive = buttons.some(function (item) {
          return item.classList.contains("active");
        });

        submitButton.style.display = hasActive ? "block" : "none";
      });
    });

    if (submitAction) {
      submitAction.addEventListener("click", function () {
        const selected = buttons
          .filter(function (item) {
            return item.classList.contains("active");
          })
          .map(function (item) {
            return item.dataset.product;
          });

        if (!selected.length) {
          window.alert("Veuillez choisir au moins une boisson.");
          return;
        }

        window.alert(`Préférences enregistrées : ${selected.join(", ")}. Signature Dr Tech.`);
      });
    }
  }

  function initAnimations() {
    if (window.AOS && typeof window.AOS.init === "function") {
      window.AOS.init({
        once: true
      });
    }
  }

  initInvitationMedia();
  hydrateInvitationFromApi();
  initHearts();
  initDownload();
  initGuestbook();
  initPreferences();
  initAnimations();
})();
