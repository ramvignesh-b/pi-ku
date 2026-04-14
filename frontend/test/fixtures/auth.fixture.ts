export const mockMasterKey: CryptoKey = {
  type: "secret",
  algorithm: { name: "AES-GCM" },
  extractable: false,
  usages: ["encrypt", "decrypt"],
};
