const GRANT_ID = 'beta-september-2026';
const GRANT_AMOUNT = 100;

function grantBetaCredits(state, now = new Date().toISOString()) {
    let credited = 0;
    for (const user of state.users || []) {
        if (user.creditGrants?.[GRANT_ID]) continue;
        if (!Number.isFinite(user.wallet) || user.wallet < 0) throw new Error(`Invalid wallet for ${user.id}`);
    }
    for (const user of state.users || []) {
        if (user.creditGrants?.[GRANT_ID]) continue;
        user.wallet = Math.round((user.wallet + GRANT_AMOUNT) * 100) / 100;
        user.creditGrants = { ...user.creditGrants, [GRANT_ID]: { amount: GRANT_AMOUNT, at: now } };
        credited++;
    }
    return { grantId: GRANT_ID, amountPerPlayer: GRANT_AMOUNT, credited, total: credited * GRANT_AMOUNT };
}

module.exports = { grantBetaCredits, GRANT_ID, GRANT_AMOUNT };
