import config from './config';
import { Dbs, run, insert, drain } from './importer';

async function all(dbs: Dbs) {
  await drain('puzzle', dbs.dest.collection('puzzle_play').find(), async p => {
    const count = await dbs.dest.collection(config.coll.game).count({ _id: p.gameId });
    if (!count) {
      const game = await dbs.source.collection(config.coll.game).findOne({ _id: p.gameId });
      if (game) await insert(dbs.dest.collection(config.coll.game), game);
      else console.log(p.gameId, 'missing');
    }
  });
}

run((dbs, _) => all(dbs));
