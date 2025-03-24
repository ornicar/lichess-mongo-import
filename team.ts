import config from "./config";
import {
  Dbs,
  run,
  insert,
  drainBatch,
  copyManyIds,
  copySelect,
  transformUser,
} from "./importer";

async function one(dbs: Dbs, id: any) {
  const main = await dbs.source();
  const dest = await dbs.dest();
  const team = await main
    .db()
    .collection(config.coll.team)
    .findOne({ _id: id });

  if (!team) throw "No such team";
  await insert(dest.db().collection(config.coll.team), team);

  const memberCursor = () =>
    main.db().collection(config.coll.teamMember).find({ team: team._id });

  await drainBatch("team_member", memberCursor(), 100, async (members) => {
    await dest
      .db()
      .collection(config.coll.teamMember)
      .insertMany(members, { ordered: false });

    await copyManyIds(
      main.db(),
      dest.db(),
      config.coll.user,
      members.map((m) => m.user),
      transformUser,
    );
  });

  await copySelect(main.db(), dest.db(), config.coll.tournament, {
    forTeams: team._id,
  });
}

run((dbs, args) => one(dbs, args[0]));
