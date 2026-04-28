function getRating(player) {
  const skills = [
    player.stat_derecha ?? player.stat_ataque,
    player.stat_reves ?? player.stat_defensa,
    player.stat_saque,
    player.stat_volea ?? player.stat_mentalidad,
    player.stat_movilidad ?? player.stat_fisico,
    player.stat_slice,
  ].filter((value) => Number.isFinite(Number(value)))

  if (skills.length) {
    const total = skills.reduce((sum, value) => sum + Number(value), 0)
    return Math.round(total / skills.length)
  }

  return player.rating && player.rating <= 100 ? player.rating : 50
}

export { getRating }
