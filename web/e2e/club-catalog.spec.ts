import { test, expect } from '@playwright/test';
import { COMPETITIVE_GAMES } from '../src/gameplay/catalog';

const surfaces: Record<string,string> = {
    mat:'mat-board', garde:'garde', trace:'drawing-canvas', decoupe:'drawing-canvas',
    contrepied:'contrepied', ricochet:'ricochet-canvas', chroma:'chroma',
    falsestart:'signal-button', onesecond:'clock-button', onemore:'stack-canvas',
    bounce:'bounce-canvas', symbolrush:'symbol-pad', bombpass:'bomb-track',
    cupshuffle:'cup-table', duelnumeric:'numeric-answers',
};

test('club tournament presets stay tappable and create the selected room size', async ({page,request}, info) => {
    if (info.project.name.includes('mobile')) await page.setViewportSize({width:320,height:740});
    const clientId = crypto.randomUUID(), playerName = 'RoomDesign';
    const response = await request.post('/api/session/join',{data:{clientId,playerName}});
    expect(response.ok()).toBe(true);
    const {userId} = await response.json();
    await page.addInitScript(({clientId,playerName,userId}) => {
        for (const [key,value] of Object.entries({onboarded:'1',lang:'fr',client_id:clientId,player_name:playerName,user_id:userId})) localStorage.setItem(`slaptax_${key}`,value);
    }, {clientId,playerName,userId});
    await page.goto('/?tab=tournament');
    for (const name of ['4','8','16','PUBLIC','PRIVATE']) {
        const button = page.getByRole('button',{name,exact:true});
        await expect(button).toBeVisible();
        expect(await button.evaluate(node => {
            const r = node.getBoundingClientRect();
            return r.width >= 44 && r.height >= 44 && r.bottom <= innerHeight
                && node.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
        })).toBe(true);
    }
    await page.getByRole('button',{name:'8',exact:true}).click();
    await expect(page.getByRole('button',{name:'8',exact:true})).toHaveClass(/active/);
    await page.screenshot({path:info.outputPath('tournament-create.png')});
    await page.getByRole('button',{name:'Créer le tournoi',exact:true}).click();
    await expect(page.getByText('1/8 joueurs humains', {exact:true})).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path:info.outputPath('tournament-room.png'),fullPage:true});
});

for (const game of COMPETITIVE_GAMES) {
    test(`club layout: ${game.id} in French`, async ({page, request}, info) => {
        if (info.project.name.includes('mobile')) await page.setViewportSize({width:320,height:740});
        const clientId = crypto.randomUUID(), playerName = 'Camille';
        const response = await request.post('/api/session/join', {data:{clientId,playerName}});
        expect(response.ok()).toBe(true);
        const {userId} = await response.json();
        await page.addInitScript(({clientId,playerName,userId,gameId}) => {
            for (const [key,value] of Object.entries({onboarded:'1',lang:'fr',client_id:clientId,player_name:playerName,user_id:userId,training_game:gameId})) localStorage.setItem(`slaptax_${key}`,value);
        }, {clientId,playerName,userId,gameId:game.id});
        const errors:string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto('/?tab=training');
        const arena = page.locator(`section[data-game="${game.id}"]`).first();
        await expect(arena).toHaveAttribute('data-phase','briefing');
        await arena.scrollIntoViewIfNeeded();
        await page.screenshot({path:info.outputPath('briefing.png')});
        await page.getByRole('button',{name:'Entrer dans l arene'}).click();
        await expect(arena).toHaveAttribute('data-phase','playing');
        await expect(page.getByTestId(surfaces[game.id])).toBeVisible();
        await expect(page.getByText('ENTREE DANS L ARENE',{exact:true})).toHaveCount(0);
        if (game.id === 'trace') await expect(page.getByTestId('drawing')).toHaveAttribute('data-phase','observe');
        if (game.id === 'chroma') await expect(page.getByTestId('chroma')).toHaveAttribute('data-phase','mix');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const title = arena.locator('header h2');
        expect(await title.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
        if (!game.labelFr.includes(' ')) {
            expect(await title.evaluate(node => node.getBoundingClientRect().height <= parseFloat(getComputedStyle(node).lineHeight)+1), 'Single-word game title wraps').toBe(true);
        }
        for (const control of await arena.locator('button:enabled, input[type="range"], canvas').all()) {
            expect(await control.evaluate(node => {
                const r = node.getBoundingClientRect();
                return r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight
                    && node.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
            }), `${game.id}: control outside viewport or obstructed`).toBe(true);
        }
        for (const canvas of await arena.locator('canvas').all()) {
            await expect.poll(() => canvas.evaluate((node:HTMLCanvasElement) => {
                const ctx = node.getContext('2d');
                if (!ctx || !node.width || !node.height) return 0;
                const data = ctx.getImageData(0,0,node.width,node.height).data;
                const colors = new Set<string>();
                for (let i=0;i<data.length;i+=128) colors.add(`${data[i]},${data[i+1]},${data[i+2]}`);
                return colors.size;
            })).toBeGreaterThan(4);
        }
        await page.screenshot({path:info.outputPath('playing.png')});
        await expect(page.getByRole('button',{name:'Quitter l exercice'})).toBeVisible();
        await page.getByRole('button',{name:'Quitter l exercice'}).click();
        await expect(arena).toHaveAttribute('data-phase','briefing');
        expect(errors).toEqual([]);
    });
}
