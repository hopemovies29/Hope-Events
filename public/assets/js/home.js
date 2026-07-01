(function () {
  const revealNodes = document.querySelectorAll("[data-reveal]");
  const accessForm = document.getElementById("private-access-form");
  const codeInput = document.getElementById("client-code");
  const accessFeedback = document.getElementById("access-feedback");

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
    const encodedCode = encodeURIComponent(code);

    if (window.location.protocol === "file:") {
      return `./espace-client.html?key=${encodedCode}`;
    }

    return `/espace-client?key=${encodedCode}`;
  }

  function initPrivateAccess() {
    if (!accessForm || !codeInput || !accessFeedback) {
      return;
    }

    accessForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const code = codeInput.value.trim();

      if (!code) {
      accessFeedback.textContent = "Entre le code evenement ou la cle remise par Hope Events.";
        return;
      }

      accessFeedback.textContent = "Ouverture de votre espace prive...";
      window.location.href = buildClientSpaceUrl(code);
    });
  }

  initReveal();
  initPrivateAccess();
})();
