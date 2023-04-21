import config from './config';
import { Dbs, run, copyManyIds, drainBatch, copySelect } from './importer';

async function all(dbs: Dbs) {
  const main = await dbs.source();
  const study = await dbs.study();
  const dest = await dbs.dest();
  await drainBatch(
    'relay_tour',
    main.db().collection(config.coll.relayTour).find().sort({ syncedAt: -1 }).limit(100),
    10,
    async rs => {
      await dest.db().collection(config.coll.relayTour).insertMany(rs, { ordered: false });
      const tourIds = rs.map(r => r._id);
      const byTourIds = { tourId: { $in: tourIds } };
      await copyManyIds(main.db(), dest.db(), config.coll.relayTour, tourIds);
      await copySelect(main.db(), dest.db(), config.coll.relayRound, byTourIds);
      await drainBatch('relay_study', dest.db().collection(config.coll.relayRound).find(byTourIds), 10, async rs => {
        await dest.db().collection(config.coll.relayRound).insertMany(rs, { ordered: false });
        const roundIds = rs.map(r => r._id);
        await copyManyIds(study.db(), dest.db(), config.coll.study, roundIds);
        await copySelect(study.db(), dest.db(), config.coll.studyChapter, { studyId: { $in: roundIds } });
      });
    }
  );
}

run((dbs, _) => all(dbs));
