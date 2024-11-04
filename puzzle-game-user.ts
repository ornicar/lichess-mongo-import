import config from './config';
import { Dbs, run, copyManyIds, drainBatch } from './importer';

async function all(dbs: Dbs) {
  const puzzler = await dbs.puzzler();
  const source = await dbs.source();
  const dest = await dbs.dest();
  const gameIds = await puzzler
    .db()
    .collection('puzzle2')
    .distinct('gameId', {
      createdAt: { $gt: new Date(Date.now() - 1000 * 3600 * 24 * 7 * 1) },
    });
  await drainBatch(
    'game',
    dest
      .db()
      .collection('game5')
      .find({ _id: { $in: gameIds } }),
    10000,
    async gs => {
      await copyManyIds(
        source.db(),
        dest.db(),
        config.coll.user,
        gs.flatMap(g => g.us).filter(id => id && id[0] != '!')
      );
    }
  );
}

run((dbs, _) => all(dbs));
