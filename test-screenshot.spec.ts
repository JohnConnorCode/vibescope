import { test } from '@playwright/test'

test('take screenshot', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'homepage.png', fullPage: true })
})