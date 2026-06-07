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

async function get(request: APIRequestContext, path: string) {
    const response = await request.get(path);
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

}

for (const game of GAMES.slice(0, 3)) {
    test(`human tournament launches shared round: ${game.label}`, async ({ page, request }) => {
        const players = await Promise.all(
            Array.from({ length: 4 }, (_, index) => join(request, `cup-${game.id}-${index}`))
        );
        const created = await post(request, '/api/arena-tournaments', {
            hostId: players[0].userId,
            size: 4,
            visibility: 'public',
            name: `${game.label} Cup`,
        });
        for (const player of players.slice(1)) {
            await post(request, `/api/arena-tournaments/${created.tournament.id}/join`, { userId: player.userId });
        }
        await post(request, `/api/arena-tournaments/${created.tournament.id}/start`, { userId: players[0].userId });
        const bracket = await get(request, `/api/arena-tournaments/${created.tournament.id}?userId=${players[0].userId}`);
        const active = bracket.tournament.bracket[0].matches.find(
            (match: { playerAId: string; playerBId: string }) =>
                match.playerAId === players[0].userId || match.playerBId === players[0].userId
        );
        const opponentId = active.playerAId === players[0].userId ? active.playerBId : active.playerAId;
        await post(request, `/api/duels/${active.duelId}/ready`, { userId: players[0].userId, ready: true });
        await post(request, `/api/duels/${active.duelId}/ready`, { userId: opponentId, ready: true });
        await post(request, `/api/duels/${active.duelId}/start`, { userId: players[0].userId });

        async function resolveRound(round: number, firstPlayerWins: boolean) {
            const first = await get(request, `/api/duels/${active.duelId}/match?userId=${players[0].userId}`);
            const second = await get(request, `/api/duels/${active.duelId}/match?userId=${opponentId}`);
            await Promise.all([
                post(request, `/api/duels/${active.duelId}/rounds`, {
                    userId: players[0].userId,
                    round,
                    score: firstPlayerWins ? 1000 : 0,
                    metric: 900,
                    attemptToken: first.match.attemptToken,
                }),
                post(request, `/api/duels/${active.duelId}/rounds`, {
                    userId: opponentId,
                    round,
                    score: firstPlayerWins ? 0 : 1000,
                    metric: 1100,
                    attemptToken: second.match.attemptToken,
                }),
            ]);
        }
        if (game.id === 'symbolrush' || game.id === 'bombpass') await resolveRound(1, true);
        if (game.id === 'bombpass') await resolveRound(2, false);

        await identify(page, players[0]);
        await page.goto('/?tab=tournament');
        await enterGame(page, game.label, game.testId);
    });
}

test('two browsers play the same shared Bounce rally', async ({ browser, request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Two-browser synchronization is covered once on desktop.');

    const challenger = await join(request, 'shared-a');
    const opponent = await join(request, 'shared-b');
    const created = await post(request, '/api/duels', {
        challengerId: challenger.userId,
        opponentId: opponent.userId,
        stake: 2,
        draft: {
            challenger: { ban: 'cupshuffle', pick: 'bounce' },
            opponent: { ban: 'duelnumeric', pick: 'symbolrush' },
        },
    });
    await post(request, `/api/duels/${created.duel.id}/ready`, { userId: challenger.userId, ready: true });
    await post(request, `/api/duels/${created.duel.id}/ready`, { userId: opponent.userId, ready: true });
    await post(request, `/api/duels/${created.duel.id}/start`, { userId: challenger.userId });

    const challengerContext = await browser.newContext({ viewport: { width: 1180, height: 820 } });
    const opponentContext = await browser.newContext({ viewport: { width: 1180, height: 820 } });
    const challengerPage = await challengerContext.newPage();
    const opponentPage = await opponentContext.newPage();
    await identify(challengerPage, challenger);
    await identify(opponentPage, opponent);
    await Promise.all([
        challengerPage.goto('/?tab=defy'),
        opponentPage.goto('/?tab=defy'),
    ]);
    await Promise.all([
        enterGame(challengerPage, 'Bounce Panic', 'bounce-canvas'),
        enterGame(opponentPage, 'Bounce Panic', 'bounce-canvas'),
    ]);

    await Promise.all([
        expect(challengerPage.getByText('LIVE RALLY')).toBeVisible({ timeout: 10_000 }),
        expect(opponentPage.getByText('LIVE RALLY')).toBeVisible({ timeout: 10_000 }),
    ]);

    const challengerCanvas = challengerPage.getByTestId('bounce-canvas');
    const opponentCanvas = opponentPage.getByTestId('bounce-canvas');
    const challengerBox = await challengerCanvas.boundingBox();
    const opponentBox = await opponentCanvas.boundingBox();
    expect(challengerBox).not.toBeNull();
    expect(opponentBox).not.toBeNull();
    await challengerPage.mouse.move(challengerBox!.x + challengerBox!.width * .25, challengerBox!.y + challengerBox!.height * .9);
    await opponentPage.mouse.move(opponentBox!.x + opponentBox!.width * .75, opponentBox!.y + opponentBox!.height * .9);

    const before = await challengerCanvas.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
    await challengerPage.waitForTimeout(400);
    const after = await challengerCanvas.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
    expect(after).not.toBe(before);

    await Promise.all([
        challengerPage.screenshot({ path: testInfo.outputPath('shared-bounce-challenger.png'), fullPage: true }),
        opponentPage.screenshot({ path: testInfo.outputPath('shared-bounce-opponent.png'), fullPage: true }),
    ]);
    await challengerContext.close();
    await opponentContext.close();
});
