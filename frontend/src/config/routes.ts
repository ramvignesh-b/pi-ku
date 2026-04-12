export const ROUTES = {
  HOME: "/",
  ONBOARD: "/onboard",
  VERIFY_EMAIL: "/verify-email",
  ACTIVATE: "/activate/:uidb64/:token",
  LOGIN: "/login",
  DRAWER: "/drawer",
  WRITE: (public_id?: string) => `/quill/${public_id ? public_id : ""}`,
  READ: (public_id?: string) => `/read/${public_id ? public_id : ""}`,
};
