import config from './config';
import { Dbs, run, copyManyIds, drainBatch } from './importer';

async function all(dbs: Dbs) {
  const source = await dbs.source();
  const dest = await dbs.dest();
  const selectAll = {};
  await drainBatch('simul', dest.db().collection('simul').find(selectAll), 1000, async simuls => {
    await copyManyIds(
      source.db(),
      dest.db(),
      config.coll.game,
      simuls.flatMap(s => s.pairings.map((p: any) => p.gameId))
    );
  });
}

run((dbs, _) => all(dbs));
