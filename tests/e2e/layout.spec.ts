import { test, expect, type Page } from '@playwright/test'

async function open(page: Page, query = '') {
  await page.goto(`http://127.0.0.1:5174/?${query}`)
  await page.getByRole('combobox', { name: 'Test options', exact: true }).click()
  await expect(page.locator('.vsk-dropdown')).toBeVisible()
}
async function rects(page: Page) {
  return page.evaluate(() => {
    const box = (selector: string) => {
      const { top, left, right, bottom, width, height } = document
        .querySelector(selector)!
        .getBoundingClientRect()
      return { top, left, right, bottom, width, height }
    }
    return {
      control: box('.vsk-control'),
      popup: box('.vsk-dropdown'),
      list: box('.vsk-listbox'),
      scroller: box('#scroller'),
    }
  })
}

for (const teleport of ['none', 'body', 'target']) {
  test(`${teleport} popup tracks scrolling and keeps its anchor width`, async ({ page }) => {
    await open(page, `teleport=${teleport}&virtual&scale&rtl`)
    await expect
      .poll(async () => {
        const { control, popup } = await rects(page)
        return Math.abs(control.width - popup.width)
      })
      .toBeLessThan(2)
    await page.locator('#scroller').evaluate((element) => {
      element.scrollTop = 35
      element.scrollLeft = 25
    })
    await expect
      .poll(async () => {
        const { control, popup } = await rects(page)
        return Math.abs(popup.top - control.bottom - 4)
      })
      .toBeLessThan(2)
    const { control, popup } = await rects(page)
    expect(Math.abs(popup.right - control.right)).toBeLessThan(2)
    // Follow layout shifts even when no scrolling or resize event fires.
    await page.locator('#anchor').evaluate((element) => {
      element.style.left = '130px'
    })
    await expect
      .poll(async () => {
        const { control, popup } = await rects(page)
        return Math.abs(popup.right - control.right)
      })
      .toBeLessThan(2)
    await page.locator('.vsk-search').press('Escape')
    await expect(page.locator('.vsk-dropdown')).toHaveCount(0)
    await page.getByRole('combobox', { name: 'Test options', exact: true }).click()
    await expect(page.locator('.vsk-dropdown')).toBeVisible()
  })
}

test('an open popup can move between teleport targets', async ({ page }) => {
  await open(page, 'virtual&teleport=body')
  // Reparenting a focused input can trigger a browser blur; keep focus on the control.
  await page.locator('.vsk-trigger').focus()
  await page.getByLabel('Teleport target').selectOption({ label: 'Transformed target' })
  await expect(page.locator('#target > .vsk-dropdown')).toBeVisible()
  await expect
    .poll(async () => {
      const { control, popup } = await rects(page)
      return Math.abs(control.bottom + 4 - popup.top) + Math.abs(control.left - popup.left)
    })
    .toBeLessThan(2)
  await page.getByLabel('Teleport target').selectOption({ label: 'Inline' })
  await expect(page.locator('.vsk-root > .vsk-dropdown')).toBeVisible()
  await expect
    .poll(async () => {
      const { control, popup } = await rects(page)
      return Math.abs(control.bottom + 4 - popup.top) + Math.abs(control.left - popup.left)
    })
    .toBeLessThan(2)
})

test('auto placement flips above and respects a clipping container', async ({ page }) => {
  await open(page, 'virtual&top=260')
  await expect
    .poll(async () => {
      const { control, popup } = await rects(page)
      return Math.abs(popup.bottom - control.top + 4)
    })
    .toBeLessThan(2)
  const { popup, scroller } = await rects(page)
  expect(popup.top).toBeGreaterThanOrEqual(scroller.top + 15)
  await page.setViewportSize({ width: 700, height: 400 })
  await expect.poll(async () => (await rects(page)).popup.bottom).toBeLessThanOrEqual(392)
})

test('popup adapts when a clipping ancestor resizes', async ({ page }) => {
  await open(page, 'virtual&placement=bottom&top=40')
  const before = (await rects(page)).list.height
  await page.locator('#scroller').evaluate((element) => {
    element.style.height = '260px'
  })
  await expect
    .poll(async () => {
      const { popup, scroller } = await rects(page)
      return popup.bottom <= scroller.bottom - 15
    })
    .toBe(true)
  expect((await rects(page)).list.height).toBeLessThan(before)
})

for (const placement of ['top', 'bottom']) {
  test(`explicit ${placement} placement is preserved in tight space`, async ({ page }) => {
    await open(page, `virtual&placement=${placement}&top=${placement === 'top' ? 60 : 210}`)
    await expect
      .poll(async () => {
        const { control, popup } = await rects(page)
        return placement === 'top'
          ? Math.abs(popup.bottom - control.top + 4)
          : Math.abs(popup.top - control.bottom - 4)
      })
      .toBeLessThan(2)
    const { list, popup, scroller } = await rects(page)
    expect(list.height).toBeLessThan(256)
    expect(popup.top).toBeGreaterThanOrEqual(scroller.top + 15)
    expect(popup.bottom).toBeLessThanOrEqual(scroller.bottom - 15)
  })
}

test('measured grouped rows stay bounded through resize, navigation and filtering', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await open(page, 'virtual&groups&tall')
  const search = page.locator('.vsk-search')
  const options = page.locator('[role=option]')
  await search.press('Control+End')
  await expect(page.locator('[data-highlighted=true]')).toHaveText('Option 9999')
  await expect
    .poll(async () => {
      const active = await page.locator('[data-highlighted=true]').boundingBox()
      const { list } = await rects(page)
      return !!active && active.y >= list.top - 1 && active.y + active.height <= list.bottom + 1
    })
    .toBe(true)
  expect(await options.count()).toBeLessThan(40)
  await search.press('Enter')
  await expect(page.locator('output')).toContainText('9999')
  // A distant keyboard-active row must remain mounted when scrolling away from it.
  await page.locator('.vsk-listbox').evaluate((element) => {
    element.scrollTop = 0
  })
  const id = await search.getAttribute('aria-activedescendant')
  await expect(page.locator(`[id="${id}"]`)).toHaveCount(1)
  expect(await options.count()).toBeLessThan(40)
  await search.press('Control+Home')
  await expect(page.locator('[data-highlighted=true]')).toHaveText('Option 0')
  const before = await page.locator('[data-option-index="0"]').boundingBox()
  // Trigger ResizeObserver without blurring/closing the component.
  await page.getByLabel('Tall rows').dispatchEvent('click')
  await expect
    .poll(async () => {
      const first = await page.locator('[data-option-index="0"]').boundingBox()
      const second = await page.locator('[data-option-index="1"]').boundingBox()
      return !!first && !!second && Math.abs(second.y - first.y - first.height) < 1
    })
    .toBe(true)
  await expect
    .poll(async () => (await page.locator('[data-option-index="0"]').boundingBox())!.height)
    .toBeLessThan(before!.height)
  await search.fill('Option 9999')
  await expect(options).toHaveCount(1)
  await expect(options).toHaveText('Option 9999')
  await search.fill('nothing matches')
  await expect(options).toHaveCount(0)
  await search.fill('Option 1')
  await expect(options.first()).toContainText('Option 1')
  await search.fill('')
  await search.press('Control+End')
  await page.getByRole('button', { name: 'Change option count' }).dispatchEvent('click')
  await expect(options).toHaveCount(3)
  await expect(options.first()).toHaveText('Option 0')
  await search.press('Control+End')
  await expect(page.locator('[data-highlighted=true]')).toHaveText('Option 2')
  expect(errors).toEqual([])
})
