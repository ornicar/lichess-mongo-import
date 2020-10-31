import config from './config';
import { Dbs, run, insert, drain, copyMany } from './importer';

async function one(dbs: Dbs, id: string) {
    const user = await dbs.source.collection(config.coll.user).findOne({ _id: id });
    await insert(dbs.dest.collection(config.coll.user), user);

    const gameCollName = config.coll.game;
    const games = dbs.source.collection(gameCollName).find({ us: user._id });
    const gameColl = dbs.dest.collection(gameCollName);
    const gameIds: string[] = [];
    await drain(gameCollName, games, g => {
        gameIds.push(g._id);
        return insert(gameColl, g);
    });

    await copyMany(dbs, config.coll.analysis, gameIds);
}

run((dbs, args) => one(dbs, args[0].toLowerCase()));
