import config from './config';
import { Dbs, run, copyManyIds, drainBatch } from './importer';

async function all(dbs: Dbs) {
  const puzzler = await dbs.puzzler();
  const source = await dbs.source();
  const dest = await dbs.dest();
  await drainBatch(
    'puzzle',
    puzzler
      .db()
      .collection('puzzle2_puzzle')
      .find({ createdAt: { $gt: new Date(Date.now() - 1000 * 3600 * 24 * 7 * 2) } }),
    1000,
    async ps => {
      await copyManyIds(
        source.db(),
        dest.db(),
        config.coll.game,
        ps.map(p => p.gameId)
      );
    }
  );
}

run((dbs, _) => all(dbs));
