import config from "./config";
import { Dbs, run, copyManyIds, drainBatch, copySelect } from "./importer";

async function all(dbs: Dbs, tourId?: string) {
  const main = await dbs.source();
  const study = await dbs.study();
  const dest = await dbs.dest();

  if (!tourId) {
    await dest.db().collection(config.coll.relayTour).deleteMany();
    await dest.db().collection(config.coll.relayRound).deleteMany();
    await dest.db().collection(config.coll.relayGroup).deleteMany();
  } else {
    await dest
      .db()
      .collection(config.coll.relayGroup)
      .deleteOne({ tours: tourId });
  }

  await copySelect(main.db(), dest.db(), config.coll.relayGroup, {});

  async function allTourIdsOfGroup(tourId: string): Promise<string[]> {
    return await main
      .db()
      .collection(config.coll.relayGroup)
      .distinct<string>("tours", { tours: tourId });
  }

  const selectTours = async () => {
    if (tourId) {
      const ids = await allTourIdsOfGroup(tourId);
      return main
        .db()
        .collection(config.coll.relayTour)
        .find({ _id: { $in: ids as any[] } });
    }
    return main
      .db()
      .collection(config.coll.relayTour)
      .find({
        tier: { $exists: 1 },
        createdAt: { $gt: new Date(Date.now() - 1000 * 3600 * 24 * 60) },
        // createdAt: { $gt: new Date("2020/01/01") },
        // createdAt: { $gt: new Date(Date.now() - 1000 * 3600) },
      })
      .limit(100 * 1000);
  };

  const selector = await selectTours();
  await drainBatch("relay_tour", selector, 100, async (rs) => {
    await dest
      .db()
      .collection(config.coll.relayTour)
      .insertMany(rs, { ordered: false });
    const tourIds = rs.map((r) => r._id);
    const byTourIds = { tourId: { $in: tourIds } };
    // await copyManyIds(main.db(), dest.db(), config.coll.relayTour, tourIds);
    await copySelect(main.db(), dest.db(), config.coll.relayRound, byTourIds);
    await drainBatch(
      "relay_study",
      dest.db().collection(config.coll.relayRound).find(byTourIds),
      200,
      async (rs) => {
        const roundIds = rs.map((r) => r._id);
        await copyManyIds(study.db(), dest.db(), config.coll.study, roundIds);
        const chapterSelect = { studyId: { $in: roundIds } };
        await dest
          .db()
          .collection(config.coll.studyChapter)
          .deleteMany(chapterSelect);
        await copySelect(
          study.db(),
          dest.db(),
          config.coll.studyChapter,
          chapterSelect,
        );
        await copyManyIds(
          main.db(),
          dest.db(),
          config.coll.relayStats,
          roundIds,
        );
        await copyManyIds(main.db(), dest.db(), config.coll.chat, roundIds);
        const analysisIds = await dest
          .db()
          .collection(config.coll.studyChapter)
          .distinct<string>("_id", { studyId: { $in: roundIds } });
        await copyManyIds(
          main.db(),
          dest.db(),
          config.coll.analysis,
          analysisIds,
        );
      },
    );
  });
}

run((dbs, args) => all(dbs, args[0]));
