import config from './config';
import { Dbs, run, copyManyIds, drainBatch, copySelect } from './importer';

async function all(dbs: Dbs) {
  const main = await dbs.source();
  const study = await dbs.study();
  const dest = await dbs.dest();
  await dest.db().collection(config.coll.relayTour).deleteMany({});
  await dest.db().collection(config.coll.relayRound).deleteMany({});
  await drainBatch(
    'relay_tour',
    main
      .db()
      .collection(config.coll.relayTour)
      .find({ tier: { $exists: 1 } })
      .sort({ syncedAt: -1 })
      .limit(100 * 1000),
    20,
    async rs => {
      await dest.db().collection(config.coll.relayTour).insertMany(rs, { ordered: false });
      const tourIds = rs.map(r => r._id);
      const byTourIds = { tourId: { $in: tourIds } };
      await copyManyIds(main.db(), dest.db(), config.coll.relayTour, tourIds);
      await copySelect(main.db(), dest.db(), config.coll.relayRound, byTourIds);
      await drainBatch('relay_study', dest.db().collection(config.coll.relayRound).find(byTourIds), 20, async rs => {
        const roundIds = rs.map(r => r._id);
        await copyManyIds(study.db(), dest.db(), config.coll.study, roundIds);
        await copySelect(study.db(), dest.db(), config.coll.studyChapter, { studyId: { $in: roundIds } });
      });
    }
  );
}

run((dbs, _) => all(dbs));
