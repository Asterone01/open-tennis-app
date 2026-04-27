function getRating(player) {
  return player.rating || 1200 + Math.floor((player.xp || 0) / 10)
}

export { getRating }
