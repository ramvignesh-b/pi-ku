import { expect, type Page, test } from "@playwright/test";

const viewport = { width: 390, height: 664 };
test.use({ viewport, hasTouch: true });

test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/refresh/", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByTestId("splash-screen")).toBeHidden();
});

function scrollTo(page: Page, progress: number) {
  return page.evaluate((fraction) => {
    const distance = document.documentElement.scrollHeight - innerHeight;
    window.scrollTo({ top: distance * fraction, behavior: "instant" });
  }, progress);
}

test("keeps mobile captions and the envelope visible through their scenes", async ({
  page,
}) => {
  const letters = page.getByRole("heading", { name: /pen down/ });
  const burn = page.getByRole("heading", { name: /release the burden/ });
  const envelope = page.locator(".home-envelope");

  await scrollTo(page, 0.425);
  await expect(letters).toHaveCSS("opacity", "1");

  await scrollTo(page, 0.908);
  await expect(letters).toHaveCSS("opacity", "0");
  await expect(burn).toHaveCSS("opacity", "1");
  await expect(envelope).toHaveCSS("opacity", "1");

  const orb = await page.locator(".home-ambient-orb").boundingBox();
  expect(orb).not.toBeNull();
  if (orb) {
    expect(orb.width).toBeLessThan(viewport.width * 0.75);
    expect(orb.width).toBeCloseTo(orb.height);
  }

  await scrollTo(page, 0.425);
  await expect(letters).toHaveCSS("opacity", "1");
  await expect(burn).toHaveCSS("opacity", "0");
});

test("keeps the mobile address punctuation and underline with the last words", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: viewport.height });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await scrollTo(page, 0.723);

  const address = page.getByRole("heading", { name: /send it to/ });
  const lastWords = address.getByText("in the future", { exact: true });
  const underline = lastWords
    .locator("..")
    .locator(":scope > [aria-hidden=true]");
  await expect(lastWords).toHaveCSS("opacity", "1");
  await expect(underline).toBeVisible();
  const [words, line, period, or, yourself] = await Promise.all([
    lastWords.boundingBox(),
    underline.boundingBox(),
    address.getByText(".", { exact: true }).boundingBox(),
    address.getByText("or", { exact: true }).boundingBox(),
    address.getByText("yourself", { exact: true }).boundingBox(),
  ]);
  expect(words && line && period && or && yourself).toBeTruthy();
  if (words && line && period && or && yourself) {
    expect(Math.abs(or.y - yourself.y)).toBeLessThan(yourself.height / 2);
    expect(Math.abs(period.y - words.y)).toBeLessThan(words.height / 2);
    expect(period.x).toBeGreaterThanOrEqual(words.x + words.width - 1);
    expect(line.width).toBeCloseTo(words.width);
  }
});

test("lets the opening line settle before revealing unsaid", async ({
  page,
}) => {
  const headline = page.getByRole("heading", {
    name: "You've been carrying something",
  });
  const unsaid = page.getByRole("heading", { name: "unsaid", exact: true });

  await expect(headline).toHaveCSS("opacity", "1");
  await expect(unsaid).toHaveCSS("opacity", "0");
  await expect(unsaid).toHaveCSS("opacity", "1");
});

test("lets the closing line settle before long enough fades in", async ({
  page,
}) => {
  const closing = page.getByRole("heading", {
    name: /You've been carrying it/,
  });
  const phrase = closing.getByText("long enough", { exact: true });
  const actions = page.getByRole("button", { name: "I'm ready" });

  await scrollTo(page, 1);
  await expect
    .poll(() =>
      closing.evaluate((element) => {
        const { transform } = getComputedStyle(element);
        const { a, f } = new DOMMatrix(
          transform === "none" ? undefined : transform,
        );
        return a > 0.94 && a < 1 && f === 0;
      }),
    )
    .toBe(true);
  await expect
    .poll(
      () =>
        closing.evaluate((element) => [
          getComputedStyle(element).opacity,
          getComputedStyle(element.lastElementChild as Element).opacity,
        ]),
      { intervals: [50, 100] },
    )
    .toEqual(["1", "0"]);
  await expect(phrase).toHaveCSS("opacity", "1");
  await expect(actions.locator("..")).toHaveCSS("opacity", "1");
  await expect(actions).toBeInViewport({ ratio: 1 });

  await scrollTo(page, 0.93);
  await expect(closing).toHaveCSS("opacity", "0");
});

test("lifts the quill after writing the underline", async ({ page }) => {
  const underline = page.getByText("letters", { exact: true }).locator("..");
  const quill = underline.locator("svg > g");
  const ink = underline.locator("span > svg > path");

  await scrollTo(page, 0.342);
  await expect(quill).toHaveCSS("opacity", "1");
  const tipOffset = await quill.evaluate((element) => {
    const path = element.previousElementSibling as SVGPathElement;
    const drawn = 1 - parseFloat(getComputedStyle(path).strokeDashoffset);
    const tip = path.getPointAtLength(drawn * path.getTotalLength());
    const position = new DOMMatrix(getComputedStyle(element).transform);
    return Math.hypot(tip.x - position.e, tip.y - position.f);
  });
  expect(tipOffset).toBeLessThan(1);

  await scrollTo(page, 0.39);
  await expect(quill).toHaveCSS("opacity", "0");
  await expect(ink).toHaveCSS("opacity", "0.85");
  await expect(ink).toHaveCSS("stroke-dashoffset", "0px");
});
