export default {
    source: 'mongodb://localhost:27117?readPreference=secondary',
    dest: 'mongodb://localhost:27017',
    dbName: 'lichess',
    coll: {
      user: 'user4',
      tournament: 'tournament2',
      game: 'game5',
      analysis: 'analysis2'
    }
};
