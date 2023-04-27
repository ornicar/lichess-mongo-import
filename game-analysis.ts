import config from './config';
import { Dbs, run, copyManyIds, drainBatch } from './importer';

async function all(dbs: Dbs) {
  const main = await dbs.source();
  const dest = await dbs.dest();
  await drainBatch(config.coll.game, dest.db().collection(config.coll.game).find({ an: true }), 100, async gs => {
    await copyManyIds(
      main.db(),
      dest.db(),
      config.coll.analysis,
      gs.map(g => g._id)
    );
  });
}

run((dbs, _) => all(dbs));
