import { Collection, Cursor, Db, MongoClient, MongoError } from 'mongodb';
import config from './config';

export interface Dbs {
  source: Db;
  dest: Db;
  puzzler: Db;
}

export async function copyManyIds(dbs: Dbs, collName: string, allIds: string[], transform: (doc: any) => any = identity) {
  return await sequence(
    chunkArray(allIds, 1000),
    async ids => {
      console.log(`${collName} ${ids.length}`);
      const docs = await dbs.source.collection(collName).find({ _id: { $in: ids } }).toArray();
      return await insertMany(dbs.dest.collection(collName), docs.map(transform));
    });
}
export async function copyOneId(dbs: Dbs, collName: string, id: any) {
  const exists = await dbs.dest.collection(collName).countDocuments({_id:id});
  if (exists) return;
  const doc = await dbs.source.collection(collName).findOne({_id: id});
  if (doc) await insert(dbs.dest.collection(collName), doc);
}

export async function copySelect(dbs: Dbs, collName: string, select: any) {
  return await drain(
    collName,
    dbs.source.collection(collName).find(select),
    d => insert(dbs.dest.collection(collName), d)
  );
}

export async function insert(coll: Collection, doc: any) {
  return await coll.insertOne(doc).catch(ignoreDup);
}
export async function insertMany(coll: Collection, docs: any[]) {
  return await coll.insertMany(docs, {ordered: false}).catch(ignoreDup);
}

export async function drain(name: string, cursor: Cursor<any>, f: (doc: any) => Promise<any>): Promise<void> {
  let nb = 0;
  while (await cursor.hasNext()) {
    nb++;
    if (nb % 1000 === 0) console.log(`${name} ${nb}`);
    const doc = await cursor.next();
    await f(doc);
  }
}

const ignoreDup = (err: MongoError) => {
  if ([11000, 15, 22].includes(err.code as number)) return;
  console.error(err)
  process.exit(1)
}

function chunkArray<A>(array: A[], size: number): A[][] {
  let result: A[][] = []
  for (let i = 0; i < array.length; i += size) {
    let chunk = array.slice(i, i + size)
    result.push(chunk)
  }
  return result;
}

export function transformUser(u: any) {
  u.sha512 = false;
  u.salt = '';
  u.password = '11a6efa91890f4fdbdddf3c344d40b8a96eb5d5d'; // 'password'
}

const identity = <A>(a: A) => a;

async function sequence<A, B>(args: A[], f: (a: A) => Promise<B>): Promise<B[]> {
  if (!args.length) return Promise.resolve([]);
  const result = await f(args[0]);
  const nexts = await sequence(args.slice(1), f);
  return [result, ...nexts];
}

export async function run(f: (dbs: Dbs, args: any[]) => Promise<void>) {
  const clients = await Promise.all(
    [config.source, config.dest, config.puzzler].map(url =>
      MongoClient.connect(url, { useUnifiedTopology: true })
    )
  );
  const [source, dest, puzzler] = clients.map(client => client.db());
  const dbs = { source, dest, puzzler };
  console.log("Connected successfully to both DBs");

  await f(dbs, process.argv.slice(2));

  clients.forEach(c => c.close());
  console.log("Successfully closed both DBs");
}

/* process.on('unhandledRejection', (err) => { */
/*     console.error(err) */
/*     process.exit(1) */
/* }); */

/* run().catch(function(err) { */
/*     console.log(err.stack); */
/* }); */
