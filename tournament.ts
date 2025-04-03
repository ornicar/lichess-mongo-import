import config from "./config";
import {
  Dbs,
  run,
  insert,
  drain,
  copyManyIds,
  transformUser,
  copyOneId,
} from "./importer";

async function one(dbs: Dbs, id: any) {
  const main = await dbs.source();
  const dest = await dbs.dest();
  const tour = await main
    .db()
    .collection(config.coll.tournament)
    .findOne({ _id: id });
  if (!tour) {
    console.log("tournament not found", id);
    return;
  }
  await insert(dest.db().collection(config.coll.tournament), tour);

  await copyOneId(dbs, "chat", id);

  const players = main
    .db()
    .collection(config.coll.tournamentPlayer)
    .find({ tid: tour._id });
  const playerColl = dest.db().collection(config.coll.tournamentPlayer);
  const userIds: string[] = [];
  await drain(config.coll.tournamentPlayer, players, (p) => {
    userIds.push(p.uid);
    return insert(playerColl, p);
  });

  await copyManyIds(
    main.db(),
    dest.db(),
    config.coll.user,
    userIds,
    transformUser,
  );

  const pairings = main
    .db()
    .collection(config.coll.tournamentPairing)
    .find({ tid: tour!._id });
  const pairingColl = dest.db().collection(config.coll.tournamentPairing);
  const gameIds: string[] = [];
  await drain(config.coll.tournamentPairing, pairings, (p) => {
    gameIds.push(p._id);
    return insert(pairingColl, p);
  });

  await copyManyIds(main.db(), dest.db(), config.coll.game, gameIds);

  if (tour.forTeams)
    await copyManyIds(main.db(), dest.db(), config.coll.team, tour.forTeams);
}

run((dbs, args) => one(dbs, args[0]));
