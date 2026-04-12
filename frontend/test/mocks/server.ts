import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { mockUser } from "../fixtures/user.fixture";

const apiServerHost = "http://piku-server";

export const successHandlers = [
  http.post(`http://${apiServerHost}/api/auth/login/`, () =>
    HttpResponse.json({ access: "mock-access-token" }),
  ),
  http.post(`http://${apiServerHost}/api/auth/refresh/`, () =>
    HttpResponse.json({ access: "new-access-token" }),
  ),
  http.get(`http://${apiServerHost}/api/auth/me/`, () =>
    HttpResponse.json(mockUser),
  ),
  http.post(`http://${apiServerHost}/api/auth/logout/`, () =>
    HttpResponse.json({}),
  ),
];

export const errorHandlers = [
  http.post(`http://${apiServerHost}/api/auth/login/`, () =>
    HttpResponse.json({ error: "Invalid credentials" }, { status: 400 }),
  ),
  http.post(`http://${apiServerHost}/api/auth/refresh/`, () =>
    HttpResponse.json({ error: "Invalid Token" }, { status: 401 }),
  ),
  http.get(`http://${apiServerHost}/api/auth/me/`, () =>
    HttpResponse.json({ error: "Invalid Token" }, { status: 401 }),
  ),
];

export const server = setupServer(...successHandlers);
