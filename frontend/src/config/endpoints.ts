export const endpoints = {
  LOGIN: "/api/auth/login/",
  REGISTER: "/api/auth/register/",
  VERIFY_EMAIL: "/api/auth/verify-email/",
  ACTIVATE: "/api/auth/activate/:uidb64/:token/",
  ME: "/api/auth/me/",
  REFRESH: "/api/auth/refresh/",
  LOGOUT: "/api/auth/logout/",
  LETTERS: "/api/letters/",
};

// constructs dynamic path params for activate flow
export const replacePathParams = (
  url: string,
  params: Record<string, string>,
): string => {
  let constructedUrl = url;
  for (const [key, value] of Object.entries(params)) {
    constructedUrl = constructedUrl.replace(`:${key}`, value);
  }
  return constructedUrl;
};
