import { expect, type Page, test } from "@playwright/test";

const beginChunk = /\/assets\/Begin-[\w-]+\.js$/;

test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/refresh/", (route) => route.abort());
});

async function readyButton(page: Page) {
  await page.goto("/");
  await expect(page.getByTestId("splash-screen")).toBeHidden();
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  const cta = page.getByRole("button", { name: "I'm ready" });
  await expect(cta.locator("..")).toHaveCSS("opacity", "1");
  return cta;
}

async function expectBegin(page: Page) {
  await expect(page).toHaveURL(/\/begin$/);
  await expect(page.getByTestId("begin-handoff")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: /create a.*account/i }),
  ).toBeFocused();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  const name = page.getByTestId("pen-name-input");
  await name.fill("Jane");
  await expect(name).toHaveValue("Jane");
}

test("carries the illuminated desktop orb into Begin", async ({ page }) => {
  const cta = await readyButton(page);
  const entries = await page.evaluate(() => history.length);
  await cta.hover();
  const orb = page.locator(".home-ambient-orb");
  await expect(orb).toHaveCSS("opacity", "0.25");
  const origin = await orb.boundingBox();
  await cta.click();
  const handoff = page.getByTestId("begin-handoff");
  await expect(handoff).toBeVisible();
  const glow = await handoff.locator(".rounded-full").boundingBox();
  expect(origin && glow).toBeTruthy();
  if (origin && glow) {
    expect(glow.x + glow.width / 2).toBeCloseTo(origin.x + origin.width / 2, 0);
    expect(glow.y + glow.height / 2).toBeCloseTo(
      origin.y + origin.height / 2,
      0,
    );
    expect(glow.width).toBeCloseTo(glow.height, 0);
  }
  await expectBegin(page);
  expect(await page.evaluate(() => history.length)).toBe(entries);
});

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 664 }, hasTouch: true });

  test("holds one glow and shows a status while Begin loads", async ({
    page,
  }) => {
    const request = Promise.withResolvers<void>();
    let loads = 0;
    await page.route(beginChunk, async (route) => {
      loads += 1;
      await request.promise;
      await route.continue();
    });
    try {
      const cta = await readyButton(page);
      await cta.evaluate((element: HTMLButtonElement) => {
        element.click();
        element.click();
      });
      const handoff = page.getByTestId("begin-handoff");
      await expect(handoff.getByRole("status")).toHaveText("Opening…");
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByTestId("splash-screen")).toHaveCount(0);
      await expect(page.locator("main")).toHaveAttribute("inert", "");
      expect(loads).toBe(1);
      request.resolve();
      await expectBegin(page);
    } finally {
      request.resolve();
    }
  });
});

test("restores Home when Begin's chunk fails", async ({ page }) => {
  await page.route(beginChunk, (route) => route.abort());
  const cta = await readyButton(page);
  await cta.click();
  await expect(page.getByRole("status")).toContainText("Couldn’t open Begin");
  await expect(cta).toBeFocused();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId("begin-handoff")).toHaveCount(0);
});

test("restores Home on timeout and allows a fresh activation", async ({
  page,
}) => {
  const request = Promise.withResolvers<void>();
  await page.route(beginChunk, async (route) => {
    await request.promise;
    await route.continue();
  });
  try {
    const cta = await readyButton(page);
    await cta.click();
    await expect(page.getByRole("status")).toContainText("Couldn’t open Begin");
    await expect(cta).toBeFocused();
    request.resolve();
    await expect(page).toHaveURL(/\/$/);
    await cta.click();
    await expectBegin(page);
  } finally {
    request.resolve();
  }
});

test("cancels the handoff on Back without navigating when the chunk arrives", async ({
  page,
}) => {
  const request = Promise.withResolvers<void>();
  await page.route(beginChunk, async (route) => {
    await request.promise;
    await route.continue();
  });
  try {
    await page.goto("/unlock");
    const cta = await readyButton(page);
    await cta.click();
    await expect(page.getByTestId("begin-handoff")).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/unlock$/);
    request.resolve();
    await expect(page.getByTestId("begin-handoff")).toHaveCount(0);
  } finally {
    request.resolve();
  }
});

test("offers a direct handoff with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const cta = await readyButton(page);
  await cta.click();
  await expect(page.getByTestId("begin-handoff")).toHaveCount(0);
  await expectBegin(page);
});

test("keeps direct visits to Begin usable", async ({ page }) => {
  await page.goto("/begin");
  await expect(page.getByTestId("splash-screen")).toBeHidden();
  await expect(page.getByTestId("begin-handoff")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Register" })).toBeEnabled();
});
