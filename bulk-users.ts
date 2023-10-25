import config from './config';
import { Dbs, run, copyManyIds, transformUser } from './importer';

async function one(dbs: Dbs, bulkId: any) {
  const main = await dbs.source();
  const dest = await dbs.dest();
  const bulk = await dest
    .db()
    .collection('challenge_bulk')
    .findOne({_id: bulkId});

  const userIds = bulk!.games.map((g: any) => g.white).concat(bulk!.games.map((g: any) => g.black));
  await copyManyIds(main.db(), dest.db(), config.coll.user, userIds, transformUser);
}

run((dbs, args) => one(dbs, args[0]));
