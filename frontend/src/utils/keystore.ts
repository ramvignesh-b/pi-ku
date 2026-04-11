import { openDB } from "idb";

// we use this to store master key in browser - secure and good UX
const db = openDB("piku-keys", 1, {
  upgrade(db) {
    db.createObjectStore("master-key");
  },
});

export const saveMasterKey = async (key: CryptoKey) =>
  (await db).put("master-key", key, "masterKey");

export const loadMasterKey = async (): Promise<CryptoKey | null> =>
  (await db).get("master-key", "masterKey") ?? null;

export const clearMasterKey = async () =>
  (await db).delete("master-key", "masterKey");
