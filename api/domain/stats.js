function getStats(history) {
    const matches = history.length;
    const wins = history.filter((h) => h.result === "WIN").length;
    const losses = matches - wins;
    const winRate = matches ? Math.round((wins / matches) * 100) : 0;
    return { matches, wins, losses, winRate };
}

module.exports = {
    getStats,
};
