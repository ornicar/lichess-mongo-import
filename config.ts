const replicargs =
  "directConnection=true&serverSelectionTimeoutMS=2000&appName=importer";
export default {
  source: `mongodb://localhost:27117/lichess?readPreference=secondary&${replicargs}`,
  dest: `mongodb://0.0.0.0:27017/lichess`,
  puzzler: `mongodb://0.0.0.0:27317/puzzler?readPreference=secondary&${replicargs}`,
  yolo: `mongodb://0.0.0.0:27119/lichess`,
  study: `mongodb://0.0.0.0:27118/study?${replicargs}`,
  coll: {
    user: "user4",
    userPerf: "user_perf",
    tournament: "tournament2",
    tournamentPairing: "tournament_pairing",
    tournamentPlayer: "tournament_player",
    tournamentLeaderboard: "tournament_leaderboard",
    swiss: "swiss",
    swissPairing: "swiss_pairing",
    swissPlayer: "swiss_player",
    game: "game5",
    analysis: "analysis2",
    relayTour: "relay_tour",
    relayRound: "relay",
    relayGroup: "relay_group",
    relayStats: "relay_stats",
    study: "study",
    studyChapter: "study_chapter_flat",
    report: "report2",
    appeal: "appeal",
    note: "note",
    modlog: "modlog",
    playban: "playban",
    shutup: "shutup",
    msgThread: "msg_thread",
    msgMsg: "msg_msg",
    chat: "chat",
    puzzle: "puzzle2_puzzle",
    puzzleRound: "puzzle2_round",
    team: "team",
    teamMember: "team_member",
    activity: "activity2",
  },
};
