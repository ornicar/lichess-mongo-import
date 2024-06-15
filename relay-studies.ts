import config from "./config";
import { Dbs, run, copyManyIds, drainBatch, copySelect } from "./importer";

async function all(dbs: Dbs) {
  const main = await dbs.source();
  const study = await dbs.study();
  const dest = await dbs.dest();

  const localTourIds = await dest
    .db()
    .collection(config.coll.relayRound)
    .distinct("tourId", { "sync.upstream.url": /:6399/ });
  await dest
    .db()
    .collection(config.coll.relayTour)
    .deleteMany({ _id: { $nin: localTourIds } });
  await dest
    .db()
    .collection(config.coll.relayRound)
    .deleteMany({ tourId: { $nin: localTourIds } });

  const recentTours = () =>
    main
      .db()
      .collection(config.coll.relayTour)
      .find({
        tier: { $exists: 1 },
        createdAt: { $gt: new Date(Date.now() - 1000 * 3600 * 24 * 31 * 3) },
      })
      .limit(100 * 1000);

  const ids: any[] = [
    "qcYMoHup",
    "0gqPhcrR",
    "DOj6Buj2",
    "A0ngU40x",
    "4eSyuxL3",
    "dZPD5Wa0",
  ];
  const selectTours = () =>
    main
      .db()
      .collection(config.coll.relayTour)
      .find({ _id: { $in: ids } });

  await drainBatch("relay_tour", recentTours(), 20, async (rs) => {
    await dest
      .db()
      .collection(config.coll.relayTour)
      .insertMany(rs, { ordered: false });
    const tourIds = rs.map((r) => r._id);
    const byTourIds = { tourId: { $in: tourIds } };
    await copyManyIds(main.db(), dest.db(), config.coll.relayTour, tourIds);
    await copySelect(main.db(), dest.db(), config.coll.relayRound, byTourIds);
    await drainBatch(
      "relay_study",
      dest.db().collection(config.coll.relayRound).find(byTourIds),
      20,
      async (rs) => {
        const roundIds = rs.map((r) => r._id);
        await copyManyIds(study.db(), dest.db(), config.coll.study, roundIds);
        await copySelect(study.db(), dest.db(), config.coll.studyChapter, {
          studyId: { $in: roundIds },
        });
      },
    );
  });

  await copySelect(main.db(), dest.db(), config.coll.relayGroup, {});
}

run((dbs, _) => all(dbs));
