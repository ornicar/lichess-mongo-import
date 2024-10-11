import config from "./config";
import { Dbs, run, copyManyIds } from "./importer";

async function studiesByIds(dbs: Dbs, ids: string[]) {
  const study = await dbs.study();
  const dest = await dbs.dest();

  console.log(ids.length);

  await copyManyIds(study.db(), dest.db(), config.coll.study, ids);
  await copyManyIds(study.db(), dest.db(), config.coll.studyChapter, ids);
}

run((dbs, args) => studiesByIds(dbs, args[0].split(" ")));
