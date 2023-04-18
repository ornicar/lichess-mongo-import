import config from './config';
import { Dbs, run, copyManyIds, drainBatch } from './importer';

async function all(dbs: Dbs) {
  const main = await dbs.source();
  const dest = await dbs.dest();
  await drainBatch('round_alarm', dest.collection('round_alarm').find(), 1000, async ps => {
    await copyManyIds(
      main,
      dest,
      config.coll.game,
      ps.map(p => p._id)
    );
  });
}

run((dbs, _) => all(dbs));
