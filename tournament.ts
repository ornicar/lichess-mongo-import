import config from './config';
import { Dbs, run, insert, drain, copyMany, transformUser } from './importer';

async function one(dbs: Dbs, id: string) {
    const tour = await dbs.source.collection(config.coll.tournament).findOne({ _id: id });
    await insert(dbs.dest.collection(config.coll.tournament), tour);

    const playerCollName = 'tournament_player';
    const players = dbs.source.collection(playerCollName).find({ tid: tour._id });
    const playerColl = dbs.dest.collection(playerCollName);
    const userIds: string[] = [];
    await drain(playerCollName, players, p => {
      userIds.push(p.uid);
      return insert(playerColl, p);
    });

    await copyMany(dbs, config.coll.user, userIds, transformUser);

    const pairingCollName = 'tournament_pairing';
    const pairings = dbs.source.collection(pairingCollName).find({ tid: tour._id });
    const pairingColl = dbs.dest.collection(pairingCollName);
    const gameIds: string[] = [];
    await drain(pairingCollName, pairings, p => {
      gameIds.push(p._id);
      return insert(pairingColl, p);
    });

    await copyMany(dbs, config.coll.game, gameIds);
}

run((dbs, args) => one(dbs, args[0]));
