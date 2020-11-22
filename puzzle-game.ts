import config from './config';
import { Dbs, run, copyOneId, drain } from './importer';

async function all(dbs: Dbs) {
  await drain('puzzle', dbs.puzzler.collection('puzzle2_puzzle').find(), async p => {
    await copyOneId(dbs, config.coll.game, p.gameId);
  });
}

run((dbs, _) => all(dbs));
