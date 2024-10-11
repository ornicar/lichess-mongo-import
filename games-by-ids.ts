import config from "./config";
import { Dbs, run, copyManyIds } from "./importer";

async function gamesByIds(dbs: Dbs, ids: string[]) {
  const src = await dbs.source();
  const dest = await dbs.dest();
  console.log(ids.length);

  await copyManyIds(src.db(), dest.db(), config.coll.game, ids);
  await copyManyIds(src.db(), dest.db(), config.coll.analysis, ids);
}

run((dbs, args) => gamesByIds(dbs, args[0].split(" ")));
