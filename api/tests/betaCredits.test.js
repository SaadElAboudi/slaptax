const test = require('node:test');
const assert = require('node:assert/strict');
const { grantBetaCredits } = require('../domain/betaCredits');

test('beta credit grant is additive, traceable and idempotent without touching results', () => {
    const state = { users: [{ id: 'a', wallet: 0, history: [{ win: true }] }, { id: 'b', wallet: 18.75, history: [] }], duels: [{ id: 'duel' }] };
    assert.equal(grantBetaCredits(state, '2026-09-09T00:00:00Z').credited, 2);
    assert.deepEqual(state.users.map((user) => user.wallet), [100, 118.75]);
    assert.equal(grantBetaCredits(state).credited, 0);
    assert.equal(state.users[0].wallet, 100);
    assert.deepEqual(state.users[0].history, [{ win: true }]);
    assert.deepEqual(state.duels, [{ id: 'duel' }]);
});

test('invalid balances abort a grant before any wallet is mutated', () => {
    const state = { users: [{ id: 'a', wallet: 10 }, { id: 'b', wallet: 'invalid' }] };
    assert.throws(() => grantBetaCredits(state), /Invalid wallet/);
    assert.equal(state.users[0].wallet, 10);
});
