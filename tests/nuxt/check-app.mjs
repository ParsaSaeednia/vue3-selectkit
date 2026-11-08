import assert from 'node:assert/strict'
import { expect } from '@playwright/test'

export async function checkApp(browser, url) {
  // Check the actual server HTML before JavaScript can repair a rendering defect.
  const serverContext = await browser.newContext({ javaScriptEnabled: false })
  let serverIds
  try {
    const page = await serverContext.newPage()
    const response = await page.goto(url)
    assert.equal(response.status(), 200)
    for (const mode of ['shorthand', 'true', 'false', 'omitted', 'dynamic']) {
      await expect(page.locator(`[data-mode="${mode}"] .vsk-selection`)).toHaveText('Ada')
    }
    await expect(page.locator('[data-mode=shorthand] .vsk-tag')).toHaveCount(1)
    await expect(page.locator('[data-mode=false] .vsk-tag')).toHaveCount(0)
    serverIds = await page
      .locator('.vsk-trigger')
      .evaluateAll((elements) => elements.map((element) => element.id))
    assert.equal(new Set(serverIds).size, 6)
  } finally {
    await serverContext.close()
  }

  const context = await browser.newContext()
  try {
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (['warning', 'error'].includes(message.type())) errors.push(message.text())
    })
    await page.goto(url)
    await expect(page.locator('[data-mode=remote] .vsk-selection')).toHaveText('Grace')
    assert.deepEqual(
      await page
        .locator('.vsk-trigger')
        .evaluateAll((elements) => elements.map((element) => element.id)),
      serverIds,
    )
    assert.equal(
      await page
        .locator('.vsk-control')
        .first()
        .evaluate((element) => getComputedStyle(element).borderTopStyle),
      'solid',
    )

    for (const mode of ['true', 'false', 'omitted']) {
      const field = page.locator(`[data-mode="${mode}"]`)
      await field.locator('.vsk-trigger').click()
      await field.getByRole('option', { name: 'Grace', exact: true }).click()
      await expect(field.locator('pre')).toHaveText(mode === 'true' ? '[1,2]' : '2')
      await page.keyboard.press('Escape')
    }
    const dynamic = page.locator('[data-mode=dynamic]')
    await dynamic.getByRole('button', { name: 'Switch mode' }).click()
    await dynamic.locator('.vsk-trigger').click()
    await dynamic.getByRole('option', { name: 'Grace', exact: true }).click()
    await expect(dynamic.locator('pre')).toHaveText('2')
    await dynamic.getByRole('button', { name: 'Switch mode' }).click()
    await dynamic.locator('.vsk-trigger').click()
    await dynamic.getByRole('option', { name: 'Grace', exact: true }).click()
    await expect(dynamic.locator('pre')).toHaveText('[1,2]')
    await page.keyboard.press('Escape')

    const main = page.locator('[data-mode=shorthand]')
    await main.locator('.vsk-trigger').click()
    await main.getByRole('checkbox', { name: 'Select group A', exact: true }).click()
    await expect(page.getByTestId('ids')).toHaveText('[1,2]')
    await expect(main.locator('.vsk-tag-overflow')).toHaveText('+1 more')
    assert.deepEqual(
      await page.evaluate(() => new FormData(document.querySelector('form')).getAll('people')),
      ['1', '2'],
    )
    await page.getByRole('button', { name: 'Reset form', exact: true }).click()
    await expect(page.getByTestId('ids')).toHaveText('[1]')

    await page.getByRole('combobox', { name: 'Remote people', exact: true }).click()
    const remotePopup = page.locator('#teleports > .vsk-dropdown')
    await expect(remotePopup.getByRole('option')).toHaveCount(2)
    await remotePopup.getByRole('button', { name: 'Load more', exact: true }).click()
    await expect(remotePopup.getByRole('option')).toHaveCount(4)
    await remotePopup.getByRole('combobox').fill('New person')
    await remotePopup.getByRole('button', { name: 'Create “New person”', exact: true }).click()
    await expect(page.getByTestId('remote-ids')).toHaveText('[2,99]')
    assert.deepEqual(
      await page.evaluate(() => new FormData(document.querySelector('form')).getAll('remote')),
      ['2', '99'],
    )
    await page.getByRole('button', { name: 'Reset form', exact: true }).click()
    await expect(page.getByTestId('remote-ids')).toHaveText('[2]')

    await page.getByRole('button', { name: 'Toggle read only', exact: true }).click()
    await expect(main.locator('.vsk-clear')).toBeDisabled()
    await main.locator('.vsk-control').click()
    await expect(main.getByRole('option', { name: 'Grace', exact: true })).toBeDisabled()
    await main.getByRole('combobox', { name: 'Search options...' }).press('ArrowDown')
    await main.getByRole('combobox', { name: 'Search options...' }).press('Enter')
    await expect(page.getByTestId('ids')).toHaveText('[1]')
    await page.getByRole('button', { name: 'Toggle read only', exact: true }).click()
    await main.locator('.vsk-trigger').click()
    await main.getByRole('combobox', { name: 'Search options...' }).press('ArrowDown')
    await main.getByRole('combobox', { name: 'Search options...' }).press('Enter')
    await expect(page.getByTestId('ids')).toHaveText('[1,2]')
    assert.deepEqual(
      errors,
      [],
      'Nuxt must hydrate and interact without warnings or runtime errors',
    )
  } finally {
    await context.close()
  }
}
