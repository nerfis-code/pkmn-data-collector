import axios from 'axios';
import { MainClient, Pokemon, PokemonAbility, PokemonMove } from 'pokenode-ts';
import fs from 'fs'
import stringify from "json-stringify-pretty-compact";

interface PokemonPastAbilities
{
  abilities : PokemonAbility[],
  generation : { name : string, url : string}
}
interface PokemonExtended extends Pokemon
{
  past_abilities : PokemonPastAbilities[]
}
// machine tutor egg level-up POUCH@L58 POUCH$L@58 PUOCH@L$34 PUOCH:L34
type FileFype = 'cries' | 'sprites_front' | 'sprites_back' 
const getMoveWithFormat = (moves: PokemonMove[]) => {
  let movesResult : string[] = []
  for (let m of moves){
    const moveName = m.move.name
    const version = m.version_group_details.find(v => v.version_group.name == 'red-blue' || v.version_group.name == 'yellow') // estamos en la primera gen
    if (version == undefined) continue
    switch (version?.move_learn_method.name)
    {
      case 'machine' :
        movesResult.push(`${moveName}@M`)
        break
      case 'tutor' :
        movesResult.push(`${moveName}@T`)
        break
      case 'egg' :
        movesResult.push(`${moveName}@E`)
        break
      case 'level-up' :
        movesResult.push(`${moveName}@L${version.level_learned_at}`)
        break
      default:
        movesResult.push(`${moveName}@Unknown`)
        break
      
    }
  }
  return movesResult
}
const abilitiesHandler = (current: PokemonAbility[], past: PokemonPastAbilities[]) => {
  if (past?.length == 0) return current
  const oldestAbilities = past[0].abilities;
  const baseAbilities = current
  const abilitiesResult: PokemonAbility[] = []
  for (let a of baseAbilities){
      if (a.is_hidden) continue /*No existe habilidades ocultas en 1 generacion*/
      const prevAbility = oldestAbilities.find(oa => oa.slot == a.slot) 
      if (prevAbility == undefined){
        abilitiesResult.push(a)
      }
      else if (prevAbility.ability != null){
        abilitiesResult.push(prevAbility)
      }
    }
  return abilitiesResult
}

(async () => {
  const api = new MainClient();
  console.log(process.argv[2])


  await api.pokemon
    .getPokemonByName('bulbasaur')
    .then((data) => {
      const pkmn = data as PokemonExtended
      const url_front = pkmn.sprites.versions['generation-i']['red-blue'].front_transparent
      const url_back = pkmn.sprites.versions['generation-i']['red-blue'].back_transparent
      // TODO added la url deberia ser una propiedad
      const url_cries = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/${pkmn.id}.ogg`
      const pkmnGen1 = {
        ...pkmn,
        abilities : abilitiesHandler(pkmn.abilities,pkmn.past_abilities)
                      .map(a => !a.is_hidden ? `${a.ability.name}@${a.slot}` : `${a.ability.name}@H`),
        types : pkmn.past_types.length == 0 ? pkmn.types.map(t => t.type.name) : pkmn.past_types[0].types.map(t => t.type.name), // intento de tomar la primera generacion
        cries : undefined,
        forms : undefined,
        game_indices : undefined,
        location_area_encounters : undefined, // pkmn.location_area_encounters TODO fix esto deberia dar el nombre de la area no su url
        moves: undefined,
        past_abilities : undefined,
        past_types : undefined,
        species : pkmn.species.name,
        sprites : undefined,
        is_default : undefined,
        order: undefined,
        stats: { 
          hp: pkmn.stats[0].base_stat, 
          atk: pkmn.stats[1].base_stat, 
          def: pkmn.stats[2].base_stat,
          sp_atk: pkmn.stats[3].base_stat,
          sp_def: pkmn.stats[4].base_stat,
          spd: pkmn.stats[5].base_stat,
        },
        effort: {
          hp: pkmn.stats[0].effort, 
          atk: pkmn.stats[1].effort, 
          def: pkmn.stats[2].effort,
          sp_atk: pkmn.stats[3].effort,
          sp_def: pkmn.stats[4].effort,
          spd: pkmn.stats[5].effort,
        }
      }
      console.log(stringify(pkmnGen1,{ indent: 2, maxLength: 100 }))
      const moveset = getMoveWithFormat(pkmn.moves)
      downloadFile(url_front,'sprites_front')
      downloadFile(url_back,'sprites_back')
      downloadFile(url_cries,'cries')
      fs.writeFileSync(`@data/gen1/species/${pkmnGen1.id}.json`,stringify(pkmnGen1,{ indent: 2, maxLength: 100 }))
      fs.writeFileSync(`@data/gen1/moveset/${pkmnGen1.id}.json`,stringify(moveset,{ indent: 2, maxLength: 100 }))
    }) // will output 'Luxray'
    .catch((error) => console.error(error));
})();

export async function downloadFile(url: string | null, type: FileFype) {
  if ( url == null ) return  
  const path = type == 'cries' ? '@data/gen1/cries/' :  type == 'sprites_front' ? 
    '@data/gen1/sprites/front/' : '@data/gen1/sprites/back/'
    
    const _url = url.split('/')
    const name = _url[_url.length-1]                                                  
    try {
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
      });
  
      response.data.pipe(fs.createWriteStream(path + name));
      
      console.log(`Descarga completada: ${path + name}`);
    } catch (error) {
      console.error('Error al descargar:', error);
    }
  }

