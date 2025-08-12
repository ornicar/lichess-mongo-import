import config from "./config";
import {
  Dbs,
  run,
  copyManyIds,
  drainBatch,
  copyOneId,
  transformUser,
} from "./importer";

async function recent(dbs: Dbs, categ: string) {
  const main = await dbs.source();
  const dest = await dbs.dest();

  const c = await copyOneId(dbs, config.coll.forumCateg, categ);

  console.log(c!.name);

  await drainBatch(
    "topic",
    main
      .db()
      .collection(config.coll.forumTopic)
      .find({
        categId: categ,
        updatedAt: { $gt: new Date(Date.now() - 1000 * 3600 * 24 * 7) },
      }),
    10,
    async (topics) => {
      dest.db().collection(config.coll.forumTopic).insertMany(topics);
      await drainBatch(
        "post",
        main
          .db()
          .collection(config.coll.forumPost)
          .find({ topicId: { $in: topics.map((t) => t._id) } }),
        100,
        async (posts) => {
          dest.db().collection(config.coll.forumPost).insertMany(posts);
          await copyManyIds(
            main.db(),
            dest.db(),
            config.coll.user,
            posts.map((p) => p.userId),
            transformUser,
          );
        },
      );
    },
  );
}

run((dbs, args) => recent(dbs, args[0]));
