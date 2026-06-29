const {
  demoEvent,
  demoInvitations,
  guestbookMessages,
  preferenceSubmissions,
  invitationViews
} = require("../data/demo-store");
const { admin, getFirestore, getStorageBucket } = require("./firebase-admin");

const SIGNED_URL_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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

function buildInvitationPayload(eventRecord, invitationRecord) {
  return {
    token: invitationRecord.token,
    guestName: invitationRecord.guestName,
    tableName: invitationRecord.tableName || "",
    tableSlug: invitationRecord.tableSlug || "",
    invitationImage: invitationRecord.invitationImage || "",
    exportName: invitationRecord.exportName || invitationRecord.token || "hope-events-invitation",
    salutation: invitationRecord.salutation || "Cher invite",
    seats: invitationRecord.seats || 1,
    personalMessage: invitationRecord.personalMessage || "",
    coupleNames: eventRecord.coupleNames,
    title: eventRecord.title,
    dateIso: eventRecord.dateIso || "",
    dateLabel: eventRecord.dateLabel || formatDateLabel(eventRecord.dateIso),
    intro: eventRecord.intro,
    story: eventRecord.story || "",
    note: eventRecord.note || "",
    venueName: eventRecord.venueName,
    venueAddress: eventRecord.venueAddress,
    mapUrl: eventRecord.mapUrl,
    ceremonyLabel: eventRecord.ceremonyLabel || "",
    celebrationLabel: eventRecord.celebrationLabel || "",
    schedule: Array.isArray(eventRecord.schedule) ? eventRecord.schedule : [],
    palette: eventRecord.palette || {},
    coverImage: eventRecord.coverImage || "",
    footerBrand: eventRecord.footerBrand || "",
    whatsappLink: eventRecord.whatsappLink || "",
    preferences: eventRecord.preferences || {
      alcoholic: [],
      soft: []
    }
  };
}

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(value || "");
}

async function resolveInvitationImage(invitationRecord) {
  const rawImage =
    invitationRecord.invitationImageUrl ||
    invitationRecord.invitationImage ||
    "";

  if (isAbsoluteUrl(rawImage) || rawImage.startsWith("/")) {
    return rawImage;
  }

  const storagePath =
    invitationRecord.invitationStoragePath ||
    invitationRecord.storagePath ||
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
    return storagePath;
  }
}

function getCollectionName(name, fallback) {
  return process.env[name] || fallback;
}

async function getInvitationByToken(token) {
  const db = getFirestore();

  if (!db) {
    const invitationRecord = demoInvitations[token];

    if (!invitationRecord) {
      return null;
    }

    return {
      mode: "demo",
      data: buildInvitationPayload(demoEvent, invitationRecord)
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

module.exports = {
  getInvitationByToken,
  recordView,
  saveGuestbookMessage,
  savePreferences
};
