import config from "./config";
import { Dbs, run, insert, drain, copyOneId, copySelect } from "./importer";

async function recent(dbs: Dbs) {
  const main = await dbs.source();
  const dest = await dbs.dest();

  const tournaments = main
    .db()
    .collection(config.coll.tournament)
    .find({
      schedule: { $exists: 1 },
      startsAt: {
        $lt: new Date(),
        $gt: new Date(Date.now() - 1000 * 3600 * 24 * 10),
      },
    });
  await drain("tournaments", tournaments, async (t) => {
    console.log(`${t.startsAt} ${t.name} ${t.nbPlayers}`);
    await insert(dest.db().collection(config.coll.tournament), t);
    await drain(
      "tournament_player",
      main.db().collection("tournament_player").find({ tid: t._id }),
      async (player) => {
        await insert(dest.db().collection("tournament_player"), player);
        await copyOneId(dbs, config.coll.user, player.uid);
      },
    );
    await copySelect(main.db(), dest.db(), "tournament_pairing", {
      tid: t._id,
    });
    await copySelect(main.db(), dest.db(), "tournament_leaderboard", {
      t: t._id,
    });
  });
}

run((dbs, _) => recent(dbs));
