import config from './config';
import { Dbs, run, insert, drain } from './importer';

async function all(dbs: Dbs) {
  await drain('puzzle', dbs.dest.collection('puzzle').find(), async p => {
    const game = await dbs.source.collection(config.coll.game).findOne({ _id: p.gameId });
    await insert(dbs.dest.collection(config.coll.game), game);
  });
}

run((dbs, _) => all(dbs));
