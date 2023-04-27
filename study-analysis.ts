import config from './config';
import { Dbs, run, copyManyIds, drainBatch } from './importer';

// Get analysis for all study chapters
async function all(dbs: Dbs) {
  const main = await dbs.source();
  const dest = await dbs.dest();
  await drainBatch(
    config.coll.studyChapter,
    dest.db().collection(config.coll.studyChapter).find({ 'serverEval.done': true }),
    100,
    async cs => {
      await copyManyIds(
        main.db(),
        dest.db(),
        config.coll.analysis,
        cs.map(c => c._id)
      );
    }
  );
}

run((dbs, _) => all(dbs));
