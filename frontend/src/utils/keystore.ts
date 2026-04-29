import { openDB } from "idb";

// we use indexedDB to securely store master key for easier access across tabs (better UX than having to store in session)
const db = openDB("piku-keys", 1, {
  upgrade(db) {
    db.createObjectStore("master-key");
  },
});

export const saveMasterKey = async (key: CryptoKey) => {
  const database = await db;
  return await database.put("master-key", key, "masterKey");
};

export const loadMasterKey = async (): Promise<CryptoKey | null> => {
  const database = await db;
  return (await database.get("master-key", "masterKey")) || null;
};

export const clearMasterKey = async () => {
  const database = await db;
  return await database.delete("master-key", "masterKey");
};
