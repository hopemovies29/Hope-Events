(function () {
  const revealNodes = document.querySelectorAll("[data-reveal]");
  const accessForm = document.getElementById("private-access-form");
  const codeInput = document.getElementById("client-code");
  const accessFeedback = document.getElementById("access-feedback");

  async function redirectGuestToken() {
    const token = new URL(window.location.href).searchParams.get("token");

    if (!token) {
      return false;
    }

    try {
      const response = await fetch(`/api/invitation?token=${encodeURIComponent(token)}`);
      const payload = await response.json();
      const publicQrPagePath = payload && payload.data && payload.data.publicQrPagePath;

      if (!response.ok || !publicQrPagePath) {
        throw new Error("Invitation introuvable");
      }

      const separator = publicQrPagePath.indexOf("?") === -1 ? "?" : "&";
      window.location.replace(`${publicQrPagePath}${separator}token=${encodeURIComponent(token)}`);
      return true;
    } catch (error) {
      return false;
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
      {
        threshold: 0.18
      }
    );

    revealNodes.forEach(function (node) {
      observer.observe(node);
    });
  }

  function initPrivateAccess() {
    if (!accessForm || !codeInput || !accessFeedback) {
      return;
    }

    accessForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const code = codeInput.value.trim();

      if (!code) {
        accessFeedback.textContent = "Entre le code prive remis par Hope Events.";
        return;
      }

      if (window.location.protocol === "file:") {
        accessFeedback.textContent = "Utilise la version en ligne pour ouvrir un espace prive.";
        return;
      }

      accessFeedback.textContent = "Verification du code prive...";

      try {
        const response = await fetch("/api/client-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code })
        });
        const payload = await response.json();

        if (!response.ok || !payload.path) {
          throw new Error("Code prive inconnu ou espace non configure.");
        }

        window.sessionStorage.setItem("hope-events-client-code", code);
        accessFeedback.textContent = "Ouverture de votre espace prive...";
        window.location.href = payload.path;
      } catch (error) {
        accessFeedback.textContent = error.message || "Verification impossible.";
      }
    });
  }

  redirectGuestToken().then(function (isRedirecting) {
    if (isRedirecting) {
      return;
    }

    initReveal();
    initPrivateAccess();
  });
})();
