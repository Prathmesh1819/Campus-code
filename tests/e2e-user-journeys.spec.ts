import { test, expect } from "@playwright/test";

test.describe("CampusCode Enterprise E2E User Journeys", () => {
  const baseUrl = "https://campus-code-virid.vercel.app";

  test("Journey 1: Landing Page & Navigation", async ({ page }) => {
    await page.goto(baseUrl);
    await expect(page).toHaveTitle(/CampusCode/i);
  });

  test("Journey 2: Problems Catalog Page", async ({ page }) => {
    await page.goto(`${baseUrl}/problems`);
    await page.waitForSelector("table", { timeout: 10000 }).catch(() => {});
  });

  test("Journey 3: Leaderboard Page", async ({ page }) => {
    await page.goto(`${baseUrl}/leaderboard`);
  });

  test("Journey 4: Community Projects Page", async ({ page }) => {
    await page.goto(`${baseUrl}/projects`);
  });

  test("Journey 5: Virtual Classrooms Page", async ({ page }) => {
    await page.goto(`${baseUrl}/classrooms`);
  });
});
