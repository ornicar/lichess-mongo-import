import config from "./config";
import { Dbs, run, insert, drain, copyManyIds, copyOneId } from "./importer";

async function one(dbs: Dbs, id: any) {
  const source = await dbs.source();
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
  }
}

run((dbs, args) => one(dbs, args[0].toLowerCase()));
