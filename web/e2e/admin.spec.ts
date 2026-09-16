import { test, expect } from '@playwright/test';

test('private dashboard login, refresh, logout and mobile layout', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Connexion administrateur' })).toBeVisible();
    await page.getByLabel("Cle d'acces").fill('incorrect-secret-with-at-least-32-characters');
    await page.getByRole('button', { name: "Ouvrir l'observatoire" }).click();
    await expect(page.getByRole('alert')).toContainText('Acces refuse');
    await page.getByLabel("Cle d'acces").fill('playwright-admin-token-only-not-production-12345');
    await page.getByRole('button', { name: "Ouvrir l'observatoire" }).click();
    await expect(page.getByRole('heading', { name: 'Connectes maintenant' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Defis par lien' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('playwright-admin-token');
    await page.getByRole('button', { name: 'Actualiser', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Actualiser', exact: true })).toBeEnabled();
    await page.route('**/api/admin/monitoring', route => route.fulfill({ status: 503, body: '{}' }));
    await page.getByRole('button', { name: 'Actualiser', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Mesures indisponibles');
    await expect(page.getByRole('heading', { name: 'Connectes maintenant' })).toBeVisible();
    await page.unroute('**/api/admin/monitoring');
    await page.getByRole('button', { name: 'Actualiser', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await page.screenshot({ path: `/tmp/slaptax-admin-${test.info().project.name}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Se deconnecter' }).click();
    await expect(page.getByRole('heading', { name: 'Connexion administrateur' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Defis par lien' })).toHaveCount(0);
});
