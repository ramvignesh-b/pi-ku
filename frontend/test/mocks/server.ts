import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { mockUser } from "../fixtures/user.fixture";

const API_URL = "http://piku-server";

export const successHandlers = [
  http.post(`${API_URL}/api/auth/login/`, () =>
    HttpResponse.json({ access: "mock-access-token" }),
  ),
  http.post(`${API_URL}/api/auth/refresh/`, () =>
    HttpResponse.json({ access: "new-access-token" }),
  ),
  http.get(`${API_URL}/api/auth/me/`, () => HttpResponse.json(mockUser)),
  http.post(`${API_URL}/api/auth/logout/`, () => HttpResponse.json({})),
];

export const errorHandlers = [
  http.post(`${API_URL}/api/auth/login/`, () =>
    HttpResponse.json({ error: "Invalid credentials" }, { status: 400 }),
  ),
  http.post(`${API_URL}/api/auth/refresh/`, () =>
    HttpResponse.json({ error: "Invalid Token" }, { status: 401 }),
  ),
  http.get(`${API_URL}/api/auth/me/`, () =>
    HttpResponse.json({ error: "Invalid Token" }, { status: 401 }),
  ),
];

export const server = setupServer(...successHandlers);
