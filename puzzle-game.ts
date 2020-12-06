import config from './config';
import { Dbs, run, copyManyIds, drainBatch } from './importer';

async function all(dbs: Dbs) {
  await drainBatch('puzzle', dbs.puzzler.collection('puzzle2_puzzle').find(), 512, async ps => {
    await copyManyIds(dbs, config.coll.game, ps.map(p => p.gameId));
  });
}

run((dbs, _) => all(dbs));
