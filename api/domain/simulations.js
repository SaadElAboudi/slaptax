const { toMoney2 } = require("../shared/money");

function simulateDuel(stake, stats) {
    const rounds = [];
    let playerRounds = 0;
    let botRounds = 0;

    const baseSkill = 0.48 + stats.winRate / 250;

    for (let round = 1; round <= 3; round += 1) {
        if (playerRounds === 2 || botRounds === 2) break;

        const playerTap = 8 + Math.floor(Math.random() * 22);
        const botTap = 8 + Math.floor(Math.random() * 22);
        const bonus = Math.random() < baseSkill ? 2 : -1;
        const playerScore = playerTap + bonus;

        if (playerScore >= botTap) {
            playerRounds += 1;
            rounds.push({ round, player: playerScore, bot: botTap, winner: "PLAYER" });
        } else {
            botRounds += 1;
            rounds.push({ round, player: playerScore, bot: botTap, winner: "BOT" });
        }
    }

    const won = playerRounds > botRounds;
    const gross = stake * 2;
    const payout = won ? toMoney2(gross * 0.85) : 0;
    const net = won ? toMoney2(payout - stake) : toMoney2(-stake);

    return {
        won,
        playerRounds,
        botRounds,
        rounds,
        payout,
        net,
    };
}

function simulateTournament(size, stake, stats) {
    const rounds = Math.log2(size);
    const run = [];
    let alive = true;
    let reachedRound = 0;

    const baseSkill = 0.42 + stats.winRate / 220;

    for (let r = 1; r <= rounds; r += 1) {
        if (!alive) break;
        const chance = Math.min(0.85, baseSkill + (rounds - r) * 0.02);
        const wonRound = Math.random() < chance;
        if (wonRound) {
            reachedRound = r;
            run.push({ round: r, result: "WIN" });
        } else {
            alive = false;
            run.push({ round: r, result: "ELIMINATED" });
        }
    }

    const champion = alive && reachedRound === rounds;
    const grossPool = size * stake;
    const payout = champion ? toMoney2(grossPool * 0.94) : 0;
    const net = champion ? toMoney2(payout - stake) : toMoney2(-stake);

    return {
        champion,
        rounds,
        reachedRound,
        run,
        payout,
        net,
    };
}

module.exports = {
    simulateDuel,
    simulateTournament,
};
