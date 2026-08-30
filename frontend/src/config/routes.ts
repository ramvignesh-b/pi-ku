// Page Route PATTERNS
export const ROUTES = {
  HOME: "/",
  BEGIN: "/begin",
  VERIFY_EMAIL: "/verify-email",
  ACTIVATE: "/activate/:uidb64/:token",
  UNLOCK: "/unlock",
  ESCRITOIRE: "/escritoire",
  WRITE: "/quill/:public_id?",
  LETTER: "/letter/:public_id",
  ABOUT: "/know-piku",
};

// Dynamic path BUILDERS
export const PATHS = {
  write: (public_id?: string) => `/quill/${public_id ?? ""}`,
  letter: (public_id: string) => `/letter/${public_id}`,
};
