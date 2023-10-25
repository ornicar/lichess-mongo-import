import * as fs from 'fs';
import config from './config';
import { Dbs, run, upsert } from './importer';

const sep = ':';

async function one(dbs: Dbs, file: string) {
  const source = await dbs.source();
  const dest = await dbs.dest();
  const contents = fs.readFileSync(file, 'utf-8');
  const res = contents
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && l.includes(sep))
    .map(async line => {
      const [login] = line.split(sep);
      const user = await source
        .db()
        .collection(config.coll.user)
        .findOne({ $or: [{ _id: login.toLowerCase() as any }, { email: login.toLowerCase() as any }] });
      if (user) {
        console.log(`Found ${login}`);
        await upsert(dest.db().collection(config.coll.user), user);
      } else {
        console.warn(`Miss  ${login}`);
      }
      return user;
    });
  await Promise.all(res);
}

run((dbs, args) => one(dbs, args[0].toLowerCase()));
