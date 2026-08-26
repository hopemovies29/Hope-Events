import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  RecaptchaVerifier,
  getAuth,
  onAuthStateChanged,
  signInWithPhoneNumber,
  signOut
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBEnN_xYXxvY-hv6BbE2Q1F46iDYPEuR8I",
  authDomain: "hope-events.firebaseapp.com",
  projectId: "hope-events",
  storageBucket: "hope-events.firebasestorage.app",
  messagingSenderId: "957336571124",
  appId: "1:957336571124:web:7f8953dec1bb00719822a1"
};

const allowedPhones = new Set(["+243827274226", "+243824939585", "+243979988907"]);
const auth = getAuth(initializeApp(firebaseConfig));
auth.languageCode = "fr";

const phoneInput = document.getElementById("ownerPhone");
const codeInput = document.getElementById("ownerSmsCode");
const sendButton = document.getElementById("sendOwnerCode");
const verifyButton = document.getElementById("verifyOwnerCode");
const feedback = document.getElementById("ownerAuthFeedback");
const codeStep = document.getElementById("ownerCodeStep");
const gate = document.getElementById("ownerAuthGate");
let confirmationResult = null;
let verifier = null;

function normalizePhone(value) {
  return String(value || "").replace(/[^\d+]/g, "").replace(/^00/, "+");
}

function message(value, error) {
  feedback.textContent = value || "";
  feedback.classList.toggle("is-error", Boolean(error));
}

function unlock(user) {
  user.getIdToken().then(function (token) {
    window.HopeEventsOwnerAccessToken = token;
    document.body.classList.add("owner-authenticated");
    gate.setAttribute("hidden", "");
    document.dispatchEvent(new CustomEvent("hope-events-owner-authenticated"));
  });
}

function setupRecaptcha() {
  if (verifier) return verifier;
  verifier = new RecaptchaVerifier(auth, "ownerRecaptcha", { size: "invisible" });
  return verifier;
}

sendButton.addEventListener("click", async function () {
  const phone = normalizePhone(phoneInput.value);
  if (!allowedPhones.has(phone)) {
    message("Ce numéro n'est pas autorisé à ouvrir cet espace.", true);
    return;
  }

  sendButton.disabled = true;
  message("Envoi du code SMS...", false);
  try {
    confirmationResult = await signInWithPhoneNumber(auth, phone, setupRecaptcha());
    codeStep.hidden = false;
    codeInput.focus();
    message("Code envoyé par SMS. Saisissez les 6 chiffres reçus.", false);
  } catch (error) {
    message(error.message || "Impossible d'envoyer le SMS.", true);
    if (verifier) { verifier.clear(); verifier = null; }
  } finally {
    sendButton.disabled = false;
  }
});

verifyButton.addEventListener("click", async function () {
  const code = codeInput.value.trim();
  if (!confirmationResult || !code) {
    message("Saisissez le code SMS reçu.", true);
    return;
  }

  verifyButton.disabled = true;
  try {
    const result = await confirmationResult.confirm(code);
    if (!allowedPhones.has(normalizePhone(result.user.phoneNumber))) {
      await signOut(auth);
      message("Ce numéro n'est pas autorisé.", true);
      return;
    }
    unlock(result.user);
  } catch (error) {
    message("Code invalide ou expiré.", true);
  } finally {
    verifyButton.disabled = false;
  }
});

onAuthStateChanged(auth, async function (user) {
  if (!user) return;
  if (!allowedPhones.has(normalizePhone(user.phoneNumber))) {
    await signOut(auth);
    return;
  }
  unlock(user);
});
