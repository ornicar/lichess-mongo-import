import config from './config';
import { Dbs, run, copyManyIds, drainBatch } from './importer';

async function all(dbs: Dbs) {
  const puzzlerDb = await dbs.puzzler();
  const source = await dbs.source();
  const dest = await dbs.dest();
  await drainBatch(
    'puzzle',
    puzzlerDb
      .collection('puzzle2_puzzle')
      .find({ createdAt: { $gt: new Date(Date.now() - 1000 * 3600 * 24 * 7 * 2) } }),
    1000,
    async ps => {
      await copyManyIds(
        source,
        dest,
        config.coll.game,
        ps.map(p => p.gameId)
      );
    }
  );
}

run((dbs, _) => all(dbs));
