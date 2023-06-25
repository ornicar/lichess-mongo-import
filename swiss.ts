import config from './config';
import { Dbs, run, insert, drain, copyManyIds, transformUser } from './importer';

async function one(dbs: Dbs, id: any) {
  const main = await dbs.source();
  const dest = await dbs.dest();
  const tour = await main.db().collection(config.coll.swiss).findOne({ _id: id });
  await insert(dest.db().collection(config.coll.swiss), tour);

  const players = main.db().collection(config.coll.swissPlayer).find({ s: tour!._id });
  const playerColl = dest.db().collection(config.coll.swissPlayer);
  const userIds: string[] = [];
  await drain(config.coll.swissPlayer, players, p => {
    userIds.push(p.uid);
    return insert(playerColl, p);
  });

  await copyManyIds(main.db(), dest.db(), config.coll.user, userIds, transformUser);

  const pairings = main.db().collection(config.coll.swissPairing).find({ s: tour!._id });
  const pairingColl = dest.db().collection(config.coll.swissPairing);
  const gameIds: string[] = [];
  await drain(config.coll.swissPairing, pairings, p => {
    gameIds.push(p._id);
    return insert(pairingColl, p);
  });

  await copyManyIds(main.db(), dest.db(), config.coll.game, gameIds);
}

run((dbs, args) => one(dbs, args[0]));
