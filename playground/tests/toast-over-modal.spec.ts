import { expect, test } from '@playwright/test'

// The Toaster portal mounts at startup, before any dialog portal. With every floating element on
// the same z-index, DOM order put a toast raised under an open modal below the dialog backdrop.
test('a toast raised while a modal dialog is open stays above the backdrop and usable', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/toast-over-modal.html')
  await page.getByRole('button', { name: 'Open dialog' }).click()
  const dialog = page.getByRole('dialog', { name: 'Publish revision' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Publish' }).click()

  // Announced: the toast stays in the accessibility tree inside the live region, outside the
  // subtree the modal dialog hides from assistive technology.
  const viewport = page.getByRole('region', { name: 'Notifications' })
  await expect(viewport).toHaveAttribute('aria-live', 'polite')
  const toast = viewport.getByRole('dialog', { name: 'Revision published' })
  await expect(toast).toBeVisible()
  expect(
    await toast.evaluate((element) => element.closest('[aria-hidden="true"], [inert]') === null),
  ).toBe(true)

  // Visible above the backdrop: once the toast settles, the topmost element at its center is
  // part of the toast, not the dialog backdrop.
  await expect
    .poll(() =>
      toast.evaluate((element) => {
        const { x, y, width, height } = element.getBoundingClientRect()
        return element.contains(document.elementFromPoint(x + width / 2, y + height / 2))
      }),
    )
    .toBe(true)

  // F6 moves focus to the toast viewport even while the modal dialog is open.
  await page.keyboard.press('F6')
  await expect(page.locator('[data-slot="toast-viewport"]')).toBeFocused()

  // Clickable: the toast action runs while the modal dialog stays open.
  await toast.getByRole('button', { name: 'Undo' }).click()
  await expect(dialog).toContainText('Publication undone')
})
