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

// simple utility to handle path params
export const replacePathParams = (
  url: string,
  params: Record<string, string>,
): string => {
  let result = url;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, value);
  }
  return result;
};
