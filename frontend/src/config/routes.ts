// Page Route PATTERNS
export const ROUTES = {
  HOME: "/",
  ONBOARD: "/onboard",
  VERIFY_EMAIL: "/verify-email",
  ACTIVATE: "/activate/:uidb64/:token",
  LOGIN: "/login",
  DRAWER: "/drawer",
  WRITE: "/quill/:public_id?",
  READ: "/read/:public_id",
  ABOUT: "/know-piku",
};

// Dynamic path BUILDERS
export const PATHS = {
  write: (public_id?: string) => `/quill/${public_id ?? ""}`,
  read: (public_id: string) => `/read/${public_id}`,
};
