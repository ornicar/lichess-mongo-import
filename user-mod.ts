import config from "./config";
import {
  Dbs,
  run,
  copyManyIds,
  drainBatch,
  copySelect,
  insert,
  ignoreDup,
} from "./importer";

async function one(dbs: Dbs, id: any) {
  const main = await dbs.source();
  const dest = await dbs.dest();
  id = id.toLowerCase();
  const user = await main
    .db()
    .collection(config.coll.user)
    .findOne({ _id: id });
  if (!user) throw "User not found";
  insert(dest.db().collection(config.coll.user), user);
  await copySelect(main.db(), dest.db(), config.coll.report, {
    user: user._id,
  });
  await copySelect(main.db(), dest.db(), config.coll.report, {
    "atoms.by": user._id,
  });
  await copySelect(main.db(), dest.db(), config.coll.appeal, { _id: user._id });
  await copySelect(main.db(), dest.db(), config.coll.note, { to: user._id });
  await copySelect(main.db(), dest.db(), config.coll.modlog, {
    user: user._id,
  });
  await copySelect(main.db(), dest.db(), config.coll.playban, {
    _id: user._id,
  });
  await copySelect(main.db(), dest.db(), config.coll.shutup, { _id: user._id });
  const reports = await dest
    .db()
    .collection(config.coll.report)
    .find({ user: user._id })
    .toArray();
  await copySelect(main.db(), dest.db(), config.coll.user, {
    _id: { $in: reports.flatMap((r) => r.atoms.map((a: any) => a.by)) },
  });

  await drainBatch(
    config.coll.msgThread,
    main.db().collection(config.coll.msgThread).find({ users: id }),
    20,
    async (threads) => {
      await dest
        .db()
        .collection(config.coll.msgThread)
        .insertMany(threads, { ordered: false }).catch(ignoreDup);
      await copySelect(main.db(), dest.db(), config.coll.msgMsg, { tid: { $in: threads.map(t => t._id) } });
    });

  await drainBatch(config.coll.game, main
    .db()
    .collection(config.coll.game)
    .find({ us: id }), 100, async (games) => {
      await dest
        .db()
        .collection(config.coll.game)
        .insertMany(games, { ordered: false }).catch(ignoreDup);
      await copySelect(main.db(), dest.db(), config.coll.chat, { _id: { $in: games.map(g => g._id) } });
    });
}

run((dbs, args) => one(dbs, args[0]));
