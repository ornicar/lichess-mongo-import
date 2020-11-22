import config from './config';
import { Dbs, run, copyManyIds } from './importer';

async function gamesByIds(dbs: Dbs, ids: string[]) {

  console.log(ids.length);

  await copyManyIds(dbs, config.coll.game, ids);
  await copyManyIds(dbs, config.coll.analysis, ids);
}

run((dbs, args) => gamesByIds(dbs, args[0].split(' ')));
