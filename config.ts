const replicargs =
  "directConnection=true&serverSelectionTimeoutMS=2000&appName=importer";
export default {
  source: `mongodb://localhost:27117/lichess?readPreference=secondary&${replicargs}`,
  dest: `mongodb://0.0.0.0:27017/lichess`,
  puzzler: `mongodb://0.0.0.0:27017/puzzler`,
  study: `mongodb://0.0.0.0:27118/study?${replicargs}`,
  dbName: `lichess`,
  coll: {
    user: `user4`,
    tournament: `tournament2`,
    tournamentPairing: `tournament_pairing`,
    tournamentPlayer: `tournament_player`,
    swiss: `swiss`,
    swissPairing: `swiss_pairing`,
    swissPlayer: `swiss_player`,
    game: `game5`,
    analysis: `analysis2`,
    relayTour: `relay_tour`,
    relayRound: `relay`,
    relayGroup: `relay_group`,
    study: `study`,
    studyChapter: `study_chapter_flat`,
  },
};
