import config from './config';
import { Dbs, run, copySelect } from './importer';

async function all(dbs: Dbs, id: string) {
  const study = await dbs.study();
  const dest = await dbs.dest();
  await copySelect(study.db(), dest.db(), config.coll.study, { _id: id });
  await copySelect(study.db(), dest.db(), config.coll.studyChapter, { studyId: id });
}

run((dbs, [id]) => all(dbs, id));
