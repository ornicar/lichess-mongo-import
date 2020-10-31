import { Collection, Cursor, Db, MongoClient, MongoError } from 'mongodb';
import config from './config';

export interface Dbs {
  source: Db;
  dest: Db;
}

export async function copyMany(dbs: Dbs, collName: string, allIds: string[], transform: (doc: any) => any = identity) {
  return await sequence(
    chunkArray(allIds, 1000),
    async ids => {
      console.log(`${collName} ${ids.length}`);
      const docs = await dbs.source.collection(collName).find({ _id: { $in: ids } }).toArray();
      return await dbs.dest.collection(collName).insertMany(docs.map(transform)).catch(ignoreDup);
    });
}

export async function insert(coll: Collection, doc: any) {
  return await coll.insertOne(doc).catch(ignoreDup);
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
  if ([11000, 15, 22].includes(err.code!)) return;
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
    [config.source, config.dest].map(url =>
      MongoClient.connect(url, { useUnifiedTopology: true })
    )
  );
  const [source, dest] = clients.map(client => client.db(config.dbName));
  const dbs = { source, dest };
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
