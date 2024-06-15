import config from './config';
import { Dbs, run, copyManyIds, drainBatch } from './importer';

async function all(dbs: Dbs) {
  const source = await dbs.source();
  const dest = await dbs.dest();
  await drainBatch('coach', dest.db().collection('coach').find(), 1000, async cs => {
    await copyManyIds(
      source.db(),
      dest.db(),
      config.coll.user,
      cs.map(c => c._id),
    );
  });
}

run((dbs, _) => all(dbs));
