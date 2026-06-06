import { expect, test, type APIRequestContext, type Page, type TestInfo } from '@playwright/test';

const GAMES = [
    { id: 'bounce', label: 'Bounce Panic', testId: 'bounce-canvas' },
    { id: 'symbolrush', label: 'Symbol Sprint', testId: 'symbol-pad' },
    { id: 'bombpass', label: 'Bomb Pass', testId: 'bomb-track' },
    { id: 'cupshuffle', label: 'Cup Shuffle', testId: 'cup-table' },
    { id: 'duelnumeric', label: 'Duel Numeric', testId: 'numeric-answers' },
] as const;

async function post(request: APIRequestContext, path: string, body: unknown) {
    const response = await request.post(path, { data: body });
    expect(response.ok(), `${path}: ${await response.text()}`).toBeTruthy();
    return response.json();
}

async function join(request: APIRequestContext, suffix: string) {
    const clientId = `qa-${suffix}-${Date.now()}-${Math.random()}`;
    const playerName = `QA-${suffix}`.slice(0, 20);
    const data = await post(request, '/api/session/join', { playerName, clientId });
    return { userId: data.userId as string, clientId, playerName };
}

async function identify(page: Page, player: Awaited<ReturnType<typeof join>>, gameId?: string) {
    await page.addInitScript(({ userId, clientId, playerName, gameId }) => {
        localStorage.setItem('slaptax_onboarded', '1');
        localStorage.setItem('slaptax_lang', 'en');
        localStorage.setItem('slaptax_user_id', userId);
        localStorage.setItem('slaptax_client_id', clientId);
        localStorage.setItem('slaptax_player_name', playerName);
        if (gameId) localStorage.setItem('slaptax_training_game', gameId);
    }, { ...player, gameId });
}

async function enterGame(page: Page, label: string, testId: string) {
    await expect(page.getByRole('heading', { level: 3, name: label, exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Enter the arena' }).click();
    await expect(page.getByTestId(testId)).toBeVisible({ timeout: 12_000 });
}

async function verifyGame(page: Page, game: typeof GAMES[number], testInfo: TestInfo) {
    const target = page.getByTestId(game.testId);
    await expect(target).toBeVisible();

    if (game.id === 'bounce') {
        const before = await target.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
        await page.waitForTimeout(350);
        const after = await target.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
        expect(after).not.toBe(before);
        const box = await target.boundingBox();
        expect(box?.width || 0).toBeGreaterThan(280);
        expect(box?.height || 0).toBeGreaterThan(180);
        await expect(page.getByTestId('bounce-rally')).not.toHaveText('0', { timeout: 8_000 });
    }

    if (game.id === 'symbolrush') {
        const board = page.getByTestId('symbol-board');
        const sequence = Array.from(await board.getAttribute('data-qa-sequence') || '');
        expect(sequence.length).toBe(await board.locator('span').count());
        await expect(target.getByRole('button').first()).toBeEnabled({ timeout: 8_000 });
        expect(await target.getByRole('button').count()).toBe(5);
        for (const symbol of sequence) {
            await target.getByRole('button', { name: symbol, exact: true }).click();
        }
        await expect(page.getByText('PERFORMANCE LOCKED')).toBeVisible();
    }

    if (game.id === 'bombpass') {
        for (let pass = 0; pass < 9; pass += 1) {
            await page.waitForFunction(() => {
                const track = document.querySelector('[data-testid="bomb-track"]');
                const zone = track?.querySelector('span') as HTMLElement | null;
                const marker = track?.querySelector('i') as HTMLElement | null;
                if (!zone || !marker) return false;
                const left = Number.parseFloat(zone.style.left);
                const width = Number.parseFloat(zone.style.width);
                const position = Number.parseFloat(marker.style.left);
                if (position < left + 2 || position > left + width - 2) return false;
                (track as HTMLButtonElement).click();
                return true;
            }, null, { polling: 16, timeout: 4_000 });
            if (pass < 8) {
                await expect(page.getByTestId('bomb-passes')).toHaveText(String(pass + 1));
            }
        }
        await expect(page.getByText('PERFORMANCE LOCKED')).toBeVisible();
    }

    if (game.id === 'cupshuffle') {
        const tokenCup = await target.locator('button:has(i)').elementHandle();
        expect(tokenCup).not.toBeNull();
        await expect(target.getByRole('button').first()).toBeEnabled({ timeout: 9_000 });
        expect(await target.getByRole('button').count()).toBe(3);
        await tokenCup?.click();
        await expect(page.getByText('PERFORMANCE LOCKED')).toBeVisible();
    }

    if (game.id === 'duelnumeric') {
        expect(await target.getByRole('button').count()).toBe(4);
        for (let question = 0; question < 5; question += 1) {
            const label = await page.getByTestId('numeric-equation').textContent();
            const [left, operator, right] = String(label).trim().split(/\s+/);
            const answer = operator === '×' ? Number(left) * Number(right) : Number(left) + Number(right);
            await target.getByRole('button', { name: String(answer), exact: true }).click();
        }
        await expect(page.getByText('PERFORMANCE LOCKED')).toBeVisible();
    }

    await page.screenshot({
        path: testInfo.outputPath(`${game.id}.png`),
        fullPage: true,
    });
}

function duelDraft(preferred: string) {
    const others = GAMES.map((game) => game.id).filter((id) => id !== preferred);
    return {
        challenger: { ban: others[0], pick: preferred },
        opponent: { ban: others[1], pick: preferred },
    };
}

for (const game of GAMES) {
    test(`training launches and responds: ${game.label}`, async ({ page, request }, testInfo) => {
        const player = await join(request, `training-${game.id}`);
        await identify(page, player, game.id);
        await page.goto('/?tab=training');
        await enterGame(page, game.label, game.testId);
        await verifyGame(page, game, testInfo);
    });

    test(`friend duel launches real round: ${game.label}`, async ({ page, request }) => {
        const challenger = await join(request, `duel-a-${game.id}`);
        const opponent = await join(request, `duel-b-${game.id}`);
        const created = await post(request, '/api/duels', {
            challengerId: challenger.userId,
            opponentId: opponent.userId,
            stake: 2,
            draft: duelDraft(game.id),
        });
        await post(request, `/api/duels/${created.duel.id}/ready`, { userId: challenger.userId, ready: true });
        await post(request, `/api/duels/${created.duel.id}/ready`, { userId: opponent.userId, ready: true });
        await post(request, `/api/duels/${created.duel.id}/start`, { userId: challenger.userId });

        await identify(page, challenger);
        await page.goto('/?tab=defy');
        await enterGame(page, game.label, game.testId);
    });

    test(`tournament launches real round: ${game.label}`, async ({ page, request }) => {
        const player = await join(request, `tournament-${game.id}`);
        const banned = GAMES.find((entry) => entry.id !== game.id)?.id;
        await post(request, '/api/tournaments/live', {
            userId: player.userId,
            size: 8,
            stake: 2,
            draft: { ban: banned, pick: game.id },
        });

        await identify(page, player);
        await page.goto('/?tab=tournament');
        await enterGame(page, game.label, game.testId);
    });
}
