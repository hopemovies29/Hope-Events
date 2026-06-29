(function () {
  function isFileMode() {
    return window.location.protocol === "file:";
  }

  function getDemoInvitation(token) {
    if (!window.HopeEventsDemo || typeof window.HopeEventsDemo.getInvitation !== "function") {
      return null;
    }

    const invitation = window.HopeEventsDemo.getInvitation(token);

    if (!invitation) {
      return null;
    }

    return {
      ok: true,
      mode: "demo",
      data: invitation
    };
  }

  async function requestJson(url, options) {
    const response = await fetch(url, options);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Request failed");
    }

    return payload;
  }

  async function getInvitation(token) {
    if (isFileMode()) {
      const demoPayload = getDemoInvitation(token);

      if (!demoPayload) {
        throw new Error("Invitation de demo introuvable");
      }

      return demoPayload;
    }

    try {
      return await requestJson("/api/invitation?token=" + encodeURIComponent(token), {
        method: "GET"
      });
    } catch (error) {
      const demoPayload = getDemoInvitation(token);

      if (demoPayload) {
        return demoPayload;
      }

      throw error;
    }
  }

  async function postJson(url, body) {
    if (isFileMode()) {
      return {
        ok: true,
        mode: "demo",
        persisted: false
      };
    }

    return requestJson(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
  }

  window.HopeEventsApi = {
    getInvitation,
    recordView: function (token) {
      return postJson("/api/view", { token: token });
    },
    saveGuestbookMessage: function (payload) {
      return postJson("/api/guestbook", payload);
    },
    savePreferences: function (payload) {
      return postJson("/api/preferences", payload);
    }
  };
})();

