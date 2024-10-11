import config from './config';
import { Dbs, run, copyManyIds, drainBatch, copySelect } from './importer';

async function one(dbs: Dbs, id: any) {
  const main = await dbs.source();
  const dest = await dbs.dest();
  id = id.toLowerCase();
  const user = await main.db().collection(config.coll.user).findOne({ _id: id });
  if (!user) throw 'User not found';
  await dest.db().collection(config.coll.user).deleteOne({ _id: user.id });
  await dest.db().collection(config.coll.user).insertOne(user);
  await copySelect(main.db(), dest.db(), config.coll.report, { user: user.id });
  await copySelect(main.db(), dest.db(), config.coll.report, { 'atoms.by': user.id });
  await copySelect(main.db(), dest.db(), config.coll.appeal, { '_id': user.id });
  await copySelect(main.db(), dest.db(), config.coll.note, { to: user.id });
  await copySelect(main.db(), dest.db(), config.coll.modlog, { user: user.id });
  await copySelect(main.db(), dest.db(), config.coll.playban, { _id: user.id });
  await copySelect(main.db(), dest.db(), config.coll.shutup, { _id: user.id });
}

run((dbs, args) => one(dbs, args[0]));
