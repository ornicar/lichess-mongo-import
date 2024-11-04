import { Collection, Db, FindCursor, MongoClient, MongoError } from "mongodb";
import config from "./config";

type Connect = () => Promise<MongoClient>;

export interface Dbs {
  source: Connect;
  dest: Connect;
  puzzler: Connect;
  study: Connect;
}

export async function copyManyIds(
  sourceDb: Db,
  destDb: Db,
  collName: string,
  allIds: string[],
  transform: (doc: any) => any = identity,
) {
  return await sequence(chunkArray(allIds, 1000), async (ids) => {
    const existing = await destDb
      .collection(collName)
      .distinct<string>("_id", { _id: { $in: ids } as any });
    const existingSet = new Set(existing);
    const missing = ids.filter((id) => !existingSet.has(id));
    if (missing.length) {
      const docs = await sourceDb
        .collection(collName)
        .find({ _id: { $in: missing } as any })
        .toArray();
      if (docs.length) {
        console.log(`${collName} ${docs.length}`);
        return await insertMany(
          destDb.collection(collName),
          docs.map(transform),
        );
      }
    }
    return Promise.resolve();
  });
}
export async function copyOneId(dbs: Dbs, collName: string, id: any) {
  const dest = await dbs.dest();
  const source = await dbs.source();
  const exists = await dest
    .db()
    .collection(collName)
    .countDocuments({ _id: id });
  if (exists) return;
  const doc = await source.db().collection(collName).findOne({ _id: id });
  if (doc) await insert(dest.db().collection(collName), doc);
}

export async function copySelect(
  from: Db,
  to: Db,
  collName: string,
  select: any,
) {
  return await drain(collName, from.collection(collName).find(select), (d) =>
    insert(to.collection(collName), d),
  );
}

export async function insert(coll: Collection, doc: any) {
  return await coll.insertOne(doc).catch(ignoreDup);
}
export async function upsert(coll: Collection, doc: any) {
  return await coll.updateOne(
    { _id: doc._id },
    { $set: doc },
    { upsert: true },
  );
}
export async function insertMany(coll: Collection, docs: any[]) {
  return docs.length
    ? await coll.insertMany(docs, { ordered: false }).catch(ignoreDup)
    : Promise.resolve();
}

export async function drain(
  name: string,
  cursor: FindCursor<any>,
  f: (doc: any) => Promise<any>,
): Promise<void> {
  let nb = 0;
  while (await cursor.hasNext()) {
    nb++;
    const doc = await cursor.next();
    if (nb % 1000 === 0) console.log(`${name} ${nb}`);
    await f(doc);
  }
}

export async function drainBatch(
  name: string,
  cursor: FindCursor<any>,
  batchSize: number,
  f: (docs: any[]) => Promise<any>,
): Promise<void> {
  let nb = 0;
  let batch = [];
  while (await cursor.hasNext()) {
    nb++;
    const doc = await cursor.next();
    batch.push(doc);
    if (nb % batchSize === 0) {
      console.log(`${name} ${nb}`);
      await f(batch);
      batch = [];
    }
  }
  if (batch.length) {
    console.log(`${name} ${nb}`);
    await f(batch);
  }
}

export const ignoreDup = (err: MongoError) => {
  if ([11000, 15, 22].includes(err.code as number)) return;
  console.error(err);
  process.exit(1);
};

function chunkArray<A>(array: A[], size: number): A[][] {
  let result: A[][] = [];
  for (let i = 0; i < array.length; i += size) {
    let chunk = array.slice(i, i + size);
    result.push(chunk);
  }
  return result;
}

export function transformUser(u: any) {
  return {
    ...u,
    sha512: false,
    salt: "",
    password: "11a6efa91890f4fdbdddf3c344d40b8a96eb5d5d", // 'password'
  };
}

const identity = <A>(a: A) => a;

async function sequence<A, B>(
  args: A[],
  f: (a: A) => Promise<B>,
): Promise<B[]> {
  if (!args.length) return Promise.resolve([]);
  const result = await f(args[0]);
  const nexts = await sequence(args.slice(1), f);
  return [result, ...nexts];
}

interface Memo<A> {
  (): A;
  ifPresent(): A | undefined;
}

const memoize = <A>(compute: () => A): Memo<A> => {
  let computed: A;
  const m: any = () => {
    if (computed === undefined) computed = compute();
    return computed;
  };
  m.ifPresent = () => computed;
  return m as Memo<A>;
};

export async function run(f: (dbs: Dbs, args: any[]) => Promise<void>) {
  const connect = async (url: string) => {
    console.log("-------- " + url);
    return await MongoClient.connect(url);
  };
  const dbs = {
    source: memoize(() => connect(config.source)),
    dest: memoize(() => connect(config.dest)),
    puzzler: memoize(() => connect(config.puzzler)),
    study: memoize(() => connect(config.study)),
  };
  await f(dbs, process.argv.slice(2));
  Object.entries(dbs).forEach(async ([name, memo]) => {
    const connect = memo.ifPresent();
    if (connect) {
      console.log(`Closing ${name}`);
      const conn = await connect;
      await conn.close();
    }
  });

  console.log("DONE");
}

/* process.on('unhandledRejection', (err) => { */
/*     console.error(err) */
/*     process.exit(1) */
/* }); */

/* run().catch(function(err) { */
/*     console.log(err.stack); */
/* }); */
