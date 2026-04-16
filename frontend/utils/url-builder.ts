export const getBaseUrl = (
  isSslEnabled: boolean,
  domain: string | undefined,
  port: string | undefined,
): string => {
  const uriScheme = isSslEnabled ? "https" : "http";
  const baseURL = `${uriScheme}://${domain}${port ? `:${port}` : ""}`;
  return baseURL;
};
