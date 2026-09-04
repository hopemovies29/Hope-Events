(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const accessCode =
    params.get("key") ||
    params.get("code") ||
    window.sessionStorage.getItem("hope-events-client-code");
  const adminUrl = accessCode
    ? `./admin-ajouts.html?key=${encodeURIComponent(accessCode)}`
    : "./admin-ajouts.html";

  const nav = document.querySelector(".site-nav");
  if (nav && !document.getElementById("admin-nav-link")) {
    const link = document.createElement("a");
    link.id = "admin-nav-link";
    link.href = adminUrl;
    link.textContent = "Gérer les invitations";
    nav.append(link);
  }

  const hero = document.querySelector(".client-space-hero");
  if (hero && !document.getElementById("admin-space-link")) {
    const link = document.createElement("a");
    link.id = "admin-space-link";
    link.className = "button button-primary";
    link.href = adminUrl;
    link.textContent = "Ajouter, modifier ou supprimer";
    link.setAttribute("aria-label", "Gérer les tables et les invitations");
    link.style.display = "inline-flex";
    link.style.marginTop = "1.1rem";
    hero.append(link);
  }
})();
