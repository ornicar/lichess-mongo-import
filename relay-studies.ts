import config from './config';
import { Dbs, run, copyManyIds, drainBatch, copySelect } from './importer';

async function all(dbs: Dbs) {
  const main = await dbs.source();
  const study = await dbs.study();
  const dest = await dbs.dest();
  await drainBatch(
    'relay_tour',
    main.collection(config.coll.relayTour).find().sort({ syncedAt: -1 }).limit(100),
    10,
    async rs => {
      const tourIds = rs.map(r => r._id);
      const byTourIds = { tourId: { $in: tourIds } };
      await copyManyIds(main, dest, config.coll.relayTour, tourIds);
      await copySelect(main, dest, config.coll.relayRound, byTourIds);
      await drainBatch('relay_study', dest.collection(config.coll.relayRound).find(byTourIds), 10, async rs => {
        const roundIds = rs.map(r => r._id);
        await copyManyIds(study, dest, config.coll.study, roundIds);
        await copySelect(study, dest, config.coll.studyChapter, { studyId: { $in: roundIds } });
      });
    }
  );
}

run((dbs, _) => all(dbs));
