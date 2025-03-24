import config from "./config";
import { Dbs, run, insert, drain, copyManyIds } from "./importer";

async function one(dbs: Dbs, id: any) {
  const puzzler = await dbs.puzzler();
  const dest = await dbs.dest();
  const rounds = await puzzler
    .db()
    .collection(config.coll.puzzleRound)
    .find({ _id: new RegExp("^" + id + ":") })
    .limit(10)
    .toArray();
  console.log(rounds);
  dest.db().collection(config.coll.puzzleRound).insertMany(rounds);

  await copyManyIds(
    puzzler.db(),
    dest.db(),
    config.coll.puzzle,
    rounds.map((r) => r.p),
  );

  console.log(`user ${id}: ${rounds.length} rounds & puzzles`);
}

run((dbs, args) => one(dbs, args[0].toLowerCase()));
