import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function post(request: APIRequestContext, path: string, data: object) {
    const response = await request.post(path, { data });
    expect(response.ok(), await response.text()).toBeTruthy(); return response.json();
}
async function player(request: APIRequestContext, label: string) {
    const clientId = `party-${label}-${Date.now()}-${Math.random()}`;
    const playerName = label;
    const result = await post(request, '/api/session/join', { clientId, playerName });
    return { clientId, playerName, userId: result.userId as string };
}
async function identify(page: Page, identity: Awaited<ReturnType<typeof player>>, gameId?: string) {
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
    await page.addInitScript(({ identity, gameId }) => {
        localStorage.setItem('slaptax_onboarded', '1'); localStorage.setItem('slaptax_lang', 'en');
        localStorage.setItem('slaptax_user_id', identity.userId); localStorage.setItem('slaptax_client_id', identity.clientId);
        localStorage.setItem('slaptax_player_name', identity.playerName);
        if (gameId) localStorage.setItem('slaptax_training_game', gameId);
    }, { identity, gameId });
}

test('signature home is usable, has three games and no horizontal overflow', async ({ page, request }, info) => {
    await identify(page, await player(request, 'HomePlayer'));
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Between you two, who wins?' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Challenge a friend', exact: true })).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath('signature-home.png'), fullPage: true });
    await page.getByRole('button', { name: 'Play solo: Blind Clock', exact: true }).click();
    await expect(page.getByRole('heading', { level: 3, name: 'Blind Clock' })).toBeVisible();
});

test('French clock countdown is readable and the touch target is unobstructed', async ({ page, request }, info) => {
    await identify(page, await player(request, 'ChronoFrancais'), 'onesecond');
    await page.addInitScript(() => localStorage.setItem('slaptax_lang', 'fr'));
    await page.goto('/?tab=training');
    await expect(page.getByRole('heading', { level: 3, name: 'Pile Chrono' })).toBeVisible();
    await page.getByRole('button', { name: 'Entrer dans l arene' }).click();
    const button = page.getByTestId('clock-button');
    await expect(page.getByTestId('party-arena')).toHaveAttribute('data-phase', 'prepare');
    await button.scrollIntoViewIfNeeded();
    expect(await button.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        return node.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
    })).toBe(true);
    await page.screenshot({ path: info.outputPath('chrono-fr.png'), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const game of [{ id: 'falsestart', label: 'False Start' }, { id: 'onesecond', label: 'Blind Clock' }, { id: 'onemore', label: 'One More' }]) {
    test(`two friends play ${game.label} and export their real result`, async ({ browser, request }, info) => {
        test.setTimeout(120000);
        const a = await player(request, `A-${game.id}`);
        const b = await player(request, `B-${game.id}`);
        const created = await post(request, '/api/duels', { challengerId: a.userId, opponentId: b.userId, stake: 2, bestOf: 1,
            draft: { challenger: { ban: 'bounce', pick: game.id }, opponent: { ban: 'symbolrush', pick: game.id } } });
        const id = created.duel.id;
        for (const user of [a, b]) await post(request, `/api/duels/${id}/ready`, { userId: user.userId, ready: true });
        await post(request, `/api/duels/${id}/start`, { userId: a.userId });
        const contexts = await Promise.all([browser.newContext(info.project.use), browser.newContext(info.project.use)]);
        try {
            const [first, second] = await Promise.all(contexts.map((context) => context.newPage()));
            const errors: string[] = [];
            for (const page of [first, second]) page.on('pageerror', (error) => errors.push(error.message));
            await identify(first, a); await identify(second, b);
            await Promise.all([first.goto('/?tab=defy'), second.goto('/?tab=defy')]);
            for (const page of [first, second]) {
                await expect(page.getByRole('heading', { level: 3, name: game.label })).toBeVisible();
                await page.getByRole('button', { name: 'Enter the arena' }).click();
            }
            const arena = first.getByTestId('party-arena');
            await expect(arena).toHaveAttribute('data-phase', game.id === 'falsestart' ? 'wait' : game.id === 'onesecond' ? 'prepare' : 'stack');
            await first.screenshot({ path: info.outputPath(`${game.id}-playing.png`), fullPage: true });
            if (game.id === 'falsestart') {
                for (let attempt = 0; attempt < 3; attempt++) {
                    await expect(second.getByTestId('party-arena')).toHaveAttribute('data-phase', 'wait');
                    await second.getByTestId('signal-button').click();
                    await expect(second.getByTestId('party-arena')).toHaveAttribute('data-phase', 'reveal');
                }
            } else if (game.id === 'onesecond') {
                for (let attempt = 0; attempt < 3; attempt++) {
                    await expect(arena).toHaveAttribute('data-phase', 'prepare');
                    await expect(first.getByTestId('clock-button')).toBeDisabled();
                    const target = Number(await first.getByTestId('clock-target').getAttribute('data-ms'));
                    expect(target).toBeGreaterThanOrEqual(2000); expect(target).toBeLessThanOrEqual(10000);
                    await expect(second.getByTestId('clock-target')).toHaveAttribute('data-ms', String(target));
                    await expect(arena).toHaveAttribute('data-phase', 'timing');
                    await first.waitForTimeout(target);
                    await first.getByTestId('clock-button').click();
                    await expect(first.getByTestId('clock-button')).toBeDisabled();
                    await second.waitForTimeout(500);
                    await second.getByTestId('clock-button').click();
                    await expect(arena).toHaveAttribute('data-phase', 'reveal');
                }
            } else {
                async function drop(page: Page, level: number) {
                    await page.waitForFunction(() => {
                        const canvas = document.querySelector('[data-testid="stack-canvas"]') as HTMLCanvasElement;
                        if (!canvas || (canvas.parentElement as HTMLButtonElement).disabled) return false;
                        const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
                        let sum = 0, count = 0;
                        for (let y = 0; y < canvas.height; y += 4) for (let x = 0; x < canvas.width; x += 4) {
                            const i = (y * canvas.width + x) * 4;
                            if (pixels[i] > 230 && pixels[i + 1] > 180 && pixels[i + 2] < 140) { sum += x; count++; }
                        }
                        if (count && Math.abs(sum / count / canvas.width - .5) < .012) { (canvas.parentElement as HTMLButtonElement).click(); return true; }
                        return false;
                    }, null, { polling: 25, timeout: 5000 });
                    await expect(page.getByTestId('stack-canvas')).toHaveAttribute('data-level', String(level));
                }
                await drop(first, 1);
                await first.getByRole('button', { name: 'Bank tower', exact: true }).click();
                await drop(second, 1); await drop(second, 2);
                await second.getByRole('button', { name: 'Bank tower', exact: true }).click();
            }
            await expect.poll(async () => (await (await request.get(`/api/duels/${id}/match?userId=${a.userId}`)).json()).match.status).toBe('done');
            await first.getByRole('button', { name: 'See result' }).click();
            const replay = first.getByTestId('moment-replay');
            await expect(replay).toBeVisible();
            await expect(first.getByLabel('Include player names')).not.toBeChecked();
            const imageDownload = first.waitForEvent('download');
            await first.getByRole('button', { name: 'Download image', exact: true }).click();
            const image = await imageDownload;
            expect(image.suggestedFilename()).toMatch(/\.png$/);
            await image.saveAs(info.outputPath(`${game.id}-share.png`));
            if (game.id === 'onemore' && info.project.name === 'desktop-chromium') {
                const video = first.waitForEvent('download');
                await first.getByRole('button', { name: 'Download replay', exact: true }).click();
                await (await video).saveAs(info.outputPath('replay.webm'));
                const encoded = (await readFile(info.outputPath('replay.webm'))).toString('base64');
                const decoded = await first.evaluate((data) => new Promise<{ width: number; height: number; colors: number }>((resolve, reject) => {
                    const clip = document.createElement('video');
                    clip.onloadeddata = () => { clip.currentTime = .5; };
                    clip.onerror = () => reject(new Error('Replay cannot be decoded'));
                    clip.onseeked = () => {
                        const canvas = document.createElement('canvas'); canvas.width = clip.videoWidth; canvas.height = clip.videoHeight;
                        const context = canvas.getContext('2d')!; context.drawImage(clip, 0, 0);
                        resolve({ width: canvas.width, height: canvas.height, colors: new Set(context.getImageData(0, 0, canvas.width, canvas.height).data).size });
                    };
                    clip.src = `data:video/webm;base64,${data}`;
                }), encoded);
                expect(decoded.width).toBe(720); expect(decoded.height).toBe(900); expect(decoded.colors).toBeGreaterThan(10);
            }
            const match = (await (await request.get(`/api/duels/${id}/match?userId=${a.userId}`)).json()).match;
            expect(match.rounds[0].authoritative).toBe(true);
            expect(match.rounds[0].moment.gameId).toBe(game.id);
            expect(match.rounds[0].moment.replay.length).toBeGreaterThan(0);
            const season = await (await request.get(`/api/rivalries/${a.userId}/vs/${b.userId}`)).json();
            expect(season.season.matches).toBe(1);
            expect(errors).toEqual([]);
            expect(await first.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        } finally { await Promise.all(contexts.map((context) => context.close())); }
    });
}

test('solo precision uses the same engine without changing competitive balance', async ({ page, request }) => {
    test.setTimeout(75000);
    const identity = await player(request, 'SoloPrecision');
    const before = await (await request.get(`/api/state?userId=${identity.userId}`)).json();
    await identify(page, identity, 'onesecond');
    await page.goto('/?tab=training');
    await page.getByRole('button', { name: 'Enter the arena' }).click();
    for (let attempt = 0; attempt < 3; attempt++) {
        const button = page.getByTestId('clock-button');
        await expect(page.getByTestId('party-arena')).toHaveAttribute('data-phase', 'prepare');
        await expect(button).toBeDisabled();
        const target = Number(await page.getByTestId('clock-target').getAttribute('data-ms'));
        await expect(button).toBeEnabled();
        await page.waitForTimeout(target);
        await button.focus(); await page.keyboard.press('Space');
        await expect(page.getByTestId('party-arena')).toHaveAttribute('data-phase', 'reveal');
    }
    await expect(page.getByRole('button', { name: 'Replay', exact: true })).toBeVisible();
    const after = await (await request.get(`/api/state?userId=${identity.userId}`)).json();
    expect(after.wallet).toBe(before.wallet);
    expect(after.history).toEqual(before.history);
});
