const {
  demoEvents,
  demoInvitations,
  demoDefaultEventId,
  guestbookMessages,
  preferenceSubmissions,
  invitationViews,
  rsvpSubmissions
} = require("../data/demo-store");
const { admin, getFirestore, getStorageBucket } = require("./firebase-admin");

const SIGNED_URL_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function cleanText(input) {
  if (typeof input !== "string") {
    return input || "";
  }

  return input.replace(/\r/g, "").trim();
}

function buildAccessKeyCandidates(input) {
  const base = cleanText(input);

  if (!base) {
    return [];
  }

  const compact = base.replace(/[\s_]+/g, "-").replace(/-+/g, "-");
  const upper = compact.toUpperCase();
  const lower = compact.toLowerCase();

  return Array.from(
    new Set(
      [base, compact, upper, lower].filter(function (value) {
        return Boolean(value);
      })
    )
  );
}

function formatDateLabel(input) {
  if (!input) {
    return "";
  }

  const date = new Date(input);

  if (Number.isNaN(date.getTime())) {
    return String(input);
  }

  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function getDemoDefaultEvent() {
  return (
    demoEvents[demoDefaultEventId] ||
    Object.values(demoEvents)[0] ||
    null
  );
}

function getDemoEventById(eventId) {
  return demoEvents[eventId] || null;
}

function getDemoEventByAccessKey(key) {
  return (
    Object.values(demoEvents).find(function (event) {
      return event.accessKey === key || event.slug === key;
    }) || null
  );
}

function buildInvitationPayload(eventRecord, invitationRecord) {
  return {
    token: cleanText(invitationRecord.token),
    guestName: cleanText(invitationRecord.guestName),
    tableName: cleanText(invitationRecord.tableName) || "",
    tableSlug: cleanText(invitationRecord.tableSlug) || "",
    qrPagePath: cleanText(invitationRecord.qrPagePath) || "",
    invitationImage: cleanText(invitationRecord.invitationImage) || "",
    exportName:
      cleanText(invitationRecord.exportName) ||
      cleanText(invitationRecord.token) ||
      "hope-events-invitation",
    salutation: cleanText(invitationRecord.salutation) || "Cher invite",
    seats: invitationRecord.seats || 1,
    personalMessage: cleanText(invitationRecord.personalMessage) || "",
    coupleNames: cleanText(eventRecord.coupleNames),
    title: cleanText(eventRecord.title),
    eventPhrase: cleanText(eventRecord.eventPhrase) || "",
    dateIso: cleanText(eventRecord.dateIso) || "",
    dateLabel: cleanText(eventRecord.dateLabel) || formatDateLabel(eventRecord.dateIso),
    timeLabel: cleanText(eventRecord.timeLabel) || "",
    intro: cleanText(eventRecord.intro),
    story: cleanText(eventRecord.story) || "",
    note: cleanText(eventRecord.note) || "",
    venueName: cleanText(eventRecord.venueName),
    venueAddress: cleanText(eventRecord.venueAddress),
    mapUrl: cleanText(eventRecord.mapUrl),
    ceremonyLabel: cleanText(eventRecord.ceremonyLabel) || "",
    celebrationLabel: cleanText(eventRecord.celebrationLabel) || "",
    schedule: Array.isArray(eventRecord.schedule) ? eventRecord.schedule : [],
    palette: eventRecord.palette || {},
    coverImage: cleanText(eventRecord.coverImage) || "",
    footerBrand: cleanText(eventRecord.footerBrand) || "",
    publicBaseUrl: cleanText(eventRecord.publicBaseUrl) || "",
    qrCallout: cleanText(eventRecord.qrCallout) || "",
    whatsappLink: cleanText(eventRecord.whatsappLink) || "",
    preferences: eventRecord.preferences || {
      alcoholic: [],
      soft: []
    }
  };
}

function buildOwnerEventPayload(eventRecord, invitationRecords) {
  return {
    id: cleanText(eventRecord.id) || "",
    slug: cleanText(eventRecord.slug) || "",
    accessKey: cleanText(eventRecord.accessKey) || "",
    coupleNames: cleanText(eventRecord.coupleNames) || "",
    dateLabel: cleanText(eventRecord.dateLabel) || formatDateLabel(eventRecord.dateIso),
    venueName: cleanText(eventRecord.venueName) || "",
    venueAddress: cleanText(eventRecord.venueAddress) || "",
    mapUrl: cleanText(eventRecord.mapUrl) || "",
    invitations: invitationRecords
      .filter(function (item) {
        return item && item.isActive !== false;
      })
      .map(function (item) {
        const token = cleanText(item.token);

        return {
          token,
          guestName: cleanText(item.guestName) || "",
          tableName: cleanText(item.tableName) || "Sans table",
          tableSlug: cleanText(item.tableSlug) || "",
          qrPagePath: cleanText(item.qrPagePath) || "",
          seats: item.seats || 1,
          invitationUrl: `/invitation?token=${encodeURIComponent(token)}`
        };
      })
      .sort(function (a, b) {
        const tableCompare = a.tableName.localeCompare(b.tableName, "fr", {
          sensitivity: "base"
        });

        if (tableCompare !== 0) {
          return tableCompare;
        }

        return a.guestName.localeCompare(b.guestName, "fr", {
          sensitivity: "base"
        });
      })
  };
}

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(value || "");
}

async function resolveInvitationImage(invitationRecord) {
  const rawImage = cleanText(
    invitationRecord.invitationImageUrl ||
      invitationRecord.invitationImage ||
      ""
  );

  if (isAbsoluteUrl(rawImage) || rawImage.startsWith("/")) {
    return rawImage;
  }

  const storagePath =
    cleanText(invitationRecord.invitationStoragePath) ||
    cleanText(invitationRecord.storagePath) ||
    rawImage;

  if (!storagePath) {
    return "";
  }

  const bucket = getStorageBucket();

  if (!bucket) {
    return storagePath;
  }

  try {
    const [signedUrl] = await bucket.file(storagePath).getSignedUrl({
      action: "read",
      expires: Date.now() + SIGNED_URL_TTL_MS,
      version: "v4"
    });

    return signedUrl;
  } catch (error) {
    const fallbackFileName = storagePath.split("/").filter(Boolean).pop();

    if (!fallbackFileName || fallbackFileName === storagePath) {
      return storagePath;
    }

    try {
      const [fallbackSignedUrl] = await bucket.file(fallbackFileName).getSignedUrl({
        action: "read",
        expires: Date.now() + SIGNED_URL_TTL_MS,
        version: "v4"
      });

      return fallbackSignedUrl;
    } catch (fallbackError) {
      return storagePath;
    }
  }
}

function getCollectionName(name, fallback) {
  return process.env[name] || fallback;
}

async function getInvitationByToken(token) {
  const db = getFirestore();

  if (!db) {
    const invitationRecord = demoInvitations[token];
    const eventRecord = invitationRecord
      ? getDemoEventById(invitationRecord.eventId)
      : null;

    if (!invitationRecord || !eventRecord) {
      return null;
    }

    return {
      mode: "demo",
      data: buildInvitationPayload(eventRecord, invitationRecord)
    };
  }

  const invitationsCollection = getCollectionName(
    "FIREBASE_INVITATIONS_COLLECTION",
    "invitations"
  );
  const eventsCollection = getCollectionName(
    "FIREBASE_EVENTS_COLLECTION",
    "events"
  );

  const invitationSnap = await db.collection(invitationsCollection).doc(token).get();

  if (!invitationSnap.exists) {
    return null;
  }

  const invitationRecord = invitationSnap.data();

  if (invitationRecord.isActive === false) {
    return null;
  }

  const eventId = invitationRecord.eventId;
  const eventSnap = await db.collection(eventsCollection).doc(eventId).get();

  if (!eventSnap.exists) {
    throw new Error(`Event ${eventId} not found`);
  }

  const eventRecord = eventSnap.data();
  const invitationImage = await resolveInvitationImage(invitationRecord);

  return {
    mode: "firebase",
    data: buildInvitationPayload(eventRecord, {
      ...invitationRecord,
      invitationImage,
      token
    })
  };
}

async function getEventSpaceByKey(key) {
  const normalizedKey = String(key || "").trim();
  const keyCandidates = buildAccessKeyCandidates(normalizedKey);

  if (!normalizedKey) {
    return null;
  }

  const db = getFirestore();

  if (!db) {
    const demoEvent = keyCandidates
      .map(function (candidate) {
        return getDemoEventByAccessKey(candidate);
      })
      .find(Boolean);

    if (!demoEvent) {
      return null;
    }

    return {
      mode: "demo",
      data: buildOwnerEventPayload(
        demoEvent,
        Object.values(demoInvitations).filter(function (item) {
          return item.eventId === demoEvent.id;
        })
      )
    };
  }

  const eventsCollection = getCollectionName(
    "FIREBASE_EVENTS_COLLECTION",
    "events"
  );
  const invitationsCollection = getCollectionName(
    "FIREBASE_INVITATIONS_COLLECTION",
    "invitations"
  );

  let eventRecord = null;
  let eventId = "";

  for (const candidate of keyCandidates) {
    const eventQuery = await db
      .collection(eventsCollection)
      .where("accessKey", "==", candidate)
      .limit(1)
      .get();

    if (!eventQuery.empty) {
      const doc = eventQuery.docs[0];
      eventRecord = doc.data();
      eventId = doc.id;
      break;
    }
  }

  if (!eventRecord) {
    for (const candidate of keyCandidates) {
      const eventBySlug = await db.collection(eventsCollection).doc(candidate).get();

      if (eventBySlug.exists) {
        eventRecord = eventBySlug.data();
        eventId = eventBySlug.id;
        break;
      }
    }
  }

  if (!eventRecord) {
    return null;
  }

  const invitationsQuery = await db
    .collection(invitationsCollection)
    .where("eventId", "==", eventId)
    .get();

  const invitationRecords = invitationsQuery.docs.map(function (doc) {
    return {
      token: doc.id,
      ...doc.data()
    };
  });

  return {
    mode: "firebase",
    data: buildOwnerEventPayload(
      {
        ...eventRecord,
        id: eventId
      },
      invitationRecords
    )
  };
}

async function recordView(token) {
  const db = getFirestore();

  if (!db) {
    invitationViews.push({
      token,
      viewedAt: new Date().toISOString()
    });

    return {
      mode: "demo",
      persisted: false
    };
  }

  const invitationsCollection = getCollectionName(
    "FIREBASE_INVITATIONS_COLLECTION",
    "invitations"
  );

  await db.collection(invitationsCollection).doc(token).set(
    {
      viewCount: admin.firestore.FieldValue.increment(1),
      lastViewedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  return {
    mode: "firebase",
    persisted: true
  };
}

async function saveGuestbookMessage(payload) {
  const entry = {
    token: payload.token,
    author: payload.author,
    message: payload.message
  };

  const db = getFirestore();

  if (!db) {
    guestbookMessages.push({
      ...entry,
      createdAt: new Date().toISOString()
    });

    return {
      mode: "demo",
      persisted: false
    };
  }

  const guestbookCollection = getCollectionName(
    "FIREBASE_GUESTBOOK_COLLECTION",
    "guestbook_messages"
  );

  await db.collection(guestbookCollection).add({
    ...entry,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    mode: "firebase",
    persisted: true
  };
}

async function savePreferences(payload) {
  const entry = {
    token: payload.token,
    guestName: payload.guestName || "",
    choices: payload.choices
  };

  const db = getFirestore();

  if (!db) {
    preferenceSubmissions.push({
      ...entry,
      createdAt: new Date().toISOString()
    });

    return {
      mode: "demo",
      persisted: false
    };
  }

  const preferencesCollection = getCollectionName(
    "FIREBASE_PREFERENCES_COLLECTION",
    "preference_submissions"
  );

  await db.collection(preferencesCollection).add({
    ...entry,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    mode: "firebase",
    persisted: true
  };
}

async function saveRsvpSubmission(payload) {
  const entry = {
    token: payload.token,
    guestName: payload.guestName || "",
    phone: payload.phone || "",
    attendance: payload.attendance || "",
    companions: Number(payload.companions || 0),
    note: payload.note || ""
  };

  const db = getFirestore();

  if (!db) {
    rsvpSubmissions.push({
      ...entry,
      createdAt: new Date().toISOString()
    });

    return {
      mode: "demo",
      persisted: false
    };
  }

  const rsvpCollection = getCollectionName(
    "FIREBASE_RSVP_COLLECTION",
    "rsvp_submissions"
  );

  await db.collection(rsvpCollection).add({
    ...entry,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    mode: "firebase",
    persisted: true
  };
}

module.exports = {
  getInvitationByToken,
  getEventSpaceByKey,
  recordView,
  saveGuestbookMessage,
  savePreferences,
  saveRsvpSubmission
};
