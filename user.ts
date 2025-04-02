import config from "./config";
import {
  Dbs,
  run,
  insert,
  drain,
  copyManyIds,
  copyOneId,
  copySelect,
  drainBatch,
  ignoreDup,
} from "./importer";

async function one(dbs: Dbs, id: any) {
  const source = await dbs.source();
  const yolo = await dbs.yolo();
  const dest = await dbs.dest();
  const user = await source
    .db()
    .collection(config.coll.user)
    .findOne({ _id: id });

  if (user) {
    await insert(dest.db().collection(config.coll.user), user);
    await copyOneId(dbs, config.coll.userPerf, id);
    const gameCollName = config.coll.game;
    const games = source.db().collection(gameCollName).find({ us: user._id });
    const gameColl = dest.db().collection(gameCollName);
    const gameIds: string[] = [];
    await drain(gameCollName, games, (g) => {
      gameIds.push(g._id);
      return insert(gameColl, g);
    });

    await copyManyIds(source.db(), dest.db(), config.coll.analysis, gameIds);

    await copySelect(
      source.db(),
      dest.db(),
      config.coll.tournamentLeaderboard,
      { u: id },
    );

    await drainBatch(
      config.coll.tournament,
      dest.db().collection(config.coll.tournamentLeaderboard).find({ u: id }),
      20,
      async (leads) => {
        await dest
          .db()
          .collection(config.coll.tournamentLeaderboard)
          .insertMany(leads, { ordered: false })
          .catch(ignoreDup);

        await copySelect(source.db(), dest.db(), config.coll.tournament, {
          _id: { $in: leads.map((l) => l.t) },
        });

        await copySelect(source.db(), dest.db(), config.coll.tournamentPlayer, {
          tid: { $in: leads.map((l) => l.t) },
        });
      },
    );

    await copySelect(yolo.db(), dest.db(), config.coll.activity, {
      _id: new RegExp(`^${user._id}:`),
    });
  }
}

run((dbs, args) => one(dbs, args[0].toLowerCase()));
