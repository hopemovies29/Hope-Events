const admin = require("firebase-admin");

function hasFirebaseConfig() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}

function getStorageBucketName() {
  return process.env.FIREBASE_STORAGE_BUCKET || "";
}

function getPrivateKey() {
  return String(process.env.FIREBASE_PRIVATE_KEY || "")
    .replace(/^"(.*)"$/s, "$1")
    .replace(/\\n/g, "\n")
    .replace(/\r/g, "");
}

function getFirestore() {
  if (!hasFirebaseConfig()) {
    return null;
  }

  if (!admin.apps.length) {
    const storageBucket = getStorageBucketName();

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: getPrivateKey()
      }),
      ...(storageBucket ? { storageBucket } : {})
    });
  }

  return admin.firestore();
}

function getStorageBucket() {
  if (!hasFirebaseConfig()) {
    return null;
  }

  if (!admin.apps.length) {
    getFirestore();
  }

  const bucketName = getStorageBucketName();

  if (!bucketName) {
    return null;
  }

  return admin.storage().bucket(bucketName);
}

module.exports = {
  admin,
  getFirestore,
  getStorageBucket,
  hasFirebaseConfig
};
