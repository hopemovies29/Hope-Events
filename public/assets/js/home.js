(function () {
  const revealNodes = document.querySelectorAll("[data-reveal]");
  const accessForm = document.getElementById("private-access-form");
  const codeInput = document.getElementById("client-code");
  const accessFeedback = document.getElementById("access-feedback");
  const clientRoutes = {
    "07082026": {
      file: "./couple-lumu/espace-client-ben-julie.html",
      web: "/couple-lumu/espace-client-ben-julie",
      queryParam: "code"
    },
    "HE-BLJ-2026": {
      file: "./couple-lumu/espace-client-ben-julie.html",
      web: "/couple-lumu/espace-client-ben-julie",
      queryParam: "key"
    }
  };

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

  function buildClientSpaceUrl(code) {
    const normalizedCode = code
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .toUpperCase();
    const route = clientRoutes[normalizedCode] || clientRoutes[code.trim()];

    if (!route) {
      return "";
    }

    const rawCode = code.trim();
    const queryParam = route.queryParam || "code";
    const encodedCode = encodeURIComponent(rawCode);

    if (window.location.protocol === "file:") {
      return `${route.file}?${queryParam}=${encodedCode}`;
    }

    return `${route.web}?${queryParam}=${encodedCode}`;
  }

  function initPrivateAccess() {
    if (!accessForm || !codeInput || !accessFeedback) {
      return;
    }

    accessForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const code = codeInput.value.trim();

      if (!code) {
        accessFeedback.textContent = "Entre le code prive remis par Hope Events.";
        return;
      }

      const destination = buildClientSpaceUrl(code);

      if (!destination) {
        accessFeedback.textContent = "Code prive inconnu ou espace non configure.";
        return;
      }

      accessFeedback.textContent = "Ouverture de votre espace prive...";
      window.location.href = destination;
    });
  }

  initReveal();
  initPrivateAccess();
})();
