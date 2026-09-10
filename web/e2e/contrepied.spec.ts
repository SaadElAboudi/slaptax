import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

async function post(request: APIRequestContext, path: string, data: object) {
    const response = await request.post(path, { data });
    expect(response.ok(), await response.text()).toBe(true); return response.json();
}
async function player(request: APIRequestContext, playerName: string) {
    const clientId = crypto.randomUUID();
    const result = await post(request, '/api/session/join', { clientId, playerName });
    return { clientId, playerName, userId: result.userId as string };
}
async function identify(page: Page, user: Awaited<ReturnType<typeof player>>) {
    await page.addInitScript((u) => {
        localStorage.setItem('slaptax_onboarded', '1'); localStorage.setItem('slaptax_lang', 'en');
        localStorage.setItem('slaptax_client_id', u.clientId); localStorage.setItem('slaptax_user_id', u.userId);
        localStorage.setItem('slaptax_player_name', u.playerName);
    }, user);
}

test('CONTREPIED practice identifies its bot, burns an expired card and never spends wallet funds', async ({ page, request }, info) => {
    test.setTimeout(75000);
    await identify(page, await player(request, 'CardSolo')); await page.goto('/');
    await page.getByRole('button', { name: 'Play CONTREPIED', exact: true }).click();
    await page.getByRole('button', { name: 'Enter the arena' }).click();
    const game = page.getByTestId('contrepied');
    await expect(game).toHaveAttribute('data-phase', 'choose');
    await expect(page.getByText('PRACTICE AGAINST A BOT', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Commit card', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Card 5', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath('contrepied-choice.png'), fullPage: true });
    await expect(game).toHaveAttribute('data-phase', 'reveal');
    await expect(game.locator('[data-side="self"] strong')).toHaveText('1');
    await expect(page.getByRole('button', { name: 'Card 1', exact: true })).toBeDisabled();
    await page.screenshot({ path: info.outputPath('contrepied-reveal.png'), fullPage: true });
    for (const card of [2,3,4,5]) {
        await expect(game).toHaveAttribute('data-phase', 'choose');
        await page.getByRole('button', { name: `Card ${card}`, exact: true }).click();
        await page.getByRole('button', { name: 'Commit card', exact: true }).click();
        await expect(game).toHaveAttribute('data-phase', 'reveal');
    }
    await expect(game).toHaveCount(0);
    await expect(page.getByText('SLAP$ 25.00', { exact: true }).first()).toBeVisible();
});

test('CONTREPIED rivals keep committed cards secret and finish five server-scored exchanges', async ({ browser, request }, info) => {
    test.setTimeout(75000);
    const a = await player(request, 'CardA'), b = await player(request, 'CardB');
    const { duel } = await post(request, '/api/duels', { challengerId:a.userId, opponentId:b.userId, stake:2, bestOf:1,
        draft:{ challenger:{pick:'contrepied',ban:'bounce'}, opponent:{pick:'contrepied',ban:'bounce'} } });
    for (const u of [a,b]) await post(request, `/api/duels/${duel.id}/ban`, {userId:u.userId,gameId:'bounce'});
    for (const u of [a,b]) await post(request, `/api/duels/${duel.id}/ready`, {userId:u.userId,ready:true});
    await post(request, `/api/duels/${duel.id}/start`, {userId:a.userId});
    const ca = await browser.newContext(info.project.use), cb = await browser.newContext(info.project.use);
    try {
        const first = await ca.newPage(), second = await cb.newPage();
        const errors: string[] = [];
        for (const p of [first,second]) p.on('pageerror', (e) => errors.push(e.message));
        await identify(first,a); await identify(second,b);
        await first.goto('/?tab=defy'); await second.goto('/?tab=defy');
        for (const p of [first,second]) await p.getByRole('button', {name:'Enter the arena'}).click();
        for (const [one,two] of [[2,1],[3,2],[4,3],[5,4],[1,5]]) {
            for (const p of [first,second]) await expect(p.getByTestId('contrepied')).toHaveAttribute('data-phase','choose');
            await first.getByRole('button', {name:`Card ${one}`,exact:true}).click();
            await first.getByRole('button', {name:'Commit card',exact:true}).click();
            await expect(first.getByRole('button', {name:'Card locked',exact:true})).toBeDisabled();
            await expect(second.getByTestId('contrepied').locator('[data-side="rival"] strong')).toHaveCount(0);
            await second.getByRole('button', {name:`Card ${two}`,exact:true}).click();
            await second.getByRole('button', {name:'Commit card',exact:true}).click();
            await expect(first.getByTestId('contrepied')).toHaveAttribute('data-phase','reveal');
            await expect(first.getByRole('button', {name:`Card ${one}`,exact:true})).toBeDisabled();
        }
        for (const p of [first,second]) await expect(p.getByTestId('round-recap')).toBeVisible();
        const data = await (await request.get(`/api/duels/${duel.id}/match?userId=${a.userId}`, {maxRetries:2})).json();
        expect(data.match.status).toBe('done'); expect(data.match.rounds[0].winnerId).toBe(a.userId);
        const moment = data.match.rounds[0].moment;
        expect(moment.gameId).toBe('contrepied');
        expect(moment.scores[a.userId] + moment.scores[b.userId]).toBe(15);
        expect(moment.replay.some((f:{state:{contrepied:{history:unknown[]}}}) => f.state.contrepied.history.length === 5)).toBe(true);
        await first.getByRole('button', {name:'See result',exact:true}).click();
        await first.screenshot({path:info.outputPath('contrepied-result.png'),fullPage:true});
        expect(errors).toEqual([]);
    } finally { await ca.close(); await cb.close(); }
});
