import { MainClient, ItemClient, Pokemon } from 'pokenode-ts';
import { downloadFile, getMoveWithFormat, getPkmFormWithFormat, getPkmnSpeciesWithFormat, getPkmnWithFormat, load, save } from './utils';

export async function getPokemonGroupByIdLimit(id: number) {
  const api = new MainClient();
  const pokemonGroup: Obj = {}
  const speciesGroup: Obj = {}
  const movesetGroup: Obj = {}
  const formsGroup: Obj = {}
  for (let i = 1; i <= id; i++) {

    const [pkmn, species] = await Promise.all([api.pokemon.getPokemonById(i), api.pokemon.getPokemonSpeciesById(i)])
    api.pokemon.getPokemonFormById
    // savePokemonAsset(pkmn)
    const pkmn_data = getPkmnWithFormat(pkmn)
    const species_data = getPkmnSpeciesWithFormat(species)
    const moveset = getMoveWithFormat(pkmn.moves)

    pokemonGroup[pkmn_data.name] = pkmn_data
    movesetGroup[pkmn_data.name] = moveset
    speciesGroup[species_data.name] = species_data
    formsGroup[species_data.name] = []

    const forms = await Promise.all(pkmn.forms.map(f => api.pokemon.getPokemonFormByName(f.name)))
    formsGroup[species_data.name] = forms.map(f => getPkmFormWithFormat(f))

  }

  save(pokemonGroup, "pokemon")
  save(movesetGroup, "moveset")
  save(speciesGroup, "species")
  save(formsGroup, "forms")
  console.log("Todo funciono Creo")
}


async function savePokemonAsset(pkmn: Pokemon) {
  const url_front = pkmn.sprites.versions['generation-i']['red-blue'].front_transparent
  const url_back = pkmn.sprites.versions['generation-i']['red-blue'].back_transparent
  const url_cries = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/${pkmn.id}.ogg`
  downloadFile(url_front, '@data/gen1/sprites/front/')
  downloadFile(url_back, '@data/gen1/sprites/back/')
  downloadFile(url_cries, '@data/gen1/cries/')
}

export async function getAllItemNames() {
  const api = new ItemClient();
  const collection = []
  let offset = 0
  const limit = 100
  const total = 2180
  while (true) {
    const items = await api.listItems(offset, limit)
    if (items.results.length == 0) break
    for (let item of items.results) {
      collection.push(item.name)
      console.log(item.name)
    }
    offset += 100
  }
  save(collection, "AllItemsName")
}
export async function getAllItems() {
  const path = '@data/gen9/AllItemNames.json'
  const allNames: Array<string> = load(path)

  const api = new ItemClient();
  const items = await Promise.all(allNames.map(i => api.getItemByName(i)))
  const collection: Obj = {}
  for (const item of items) {

    let _machine = item.machines.at(-1)
    let machine = null
    let response = _machine === undefined ? null : await fetch(_machine.machine.url)
    if (response != null && response.ok) {
      machine = await response.json().then(d => d.move.name)
    }

    const effect_entries = item.effect_entries.reverse().find(i => i.language.name == 'en')// tener en lenguaje ingles de la ultimas generaciones
    const flavor_text_entries = item.flavor_text_entries.reverse().find(i => i.language.name == 'en')// tener en lenguaje ingles de la ultimas generaciones

    downloadFile(item.sprites.default, '@data/gen9/sprites/items/')

    const item_data = {
      name: item.name,
      id: item.id,
      attributes: item.attributes.map(i => i.name),
      category: item.category.name,
      cost: item.cost,
      effect_entries: effect_entries == undefined ? null : { ...effect_entries, language: undefined },
      flavor_text_entries: flavor_text_entries == undefined ? null : flavor_text_entries.text,
      fling_effect: item.fling_effect?.name,
      fling_power: item.fling_effect?.name,
      machine: machine
    }
    collection[item.name] = item_data
  }
  save(collection, 'items')
  console.log("felicidades, Ya tienes todos los items")
}