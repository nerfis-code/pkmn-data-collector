import axios from "axios";
import fs from 'fs'
import stringify from "json-stringify-pretty-compact";
import { Pokemon, PokemonForm, PokemonMove, PokemonSpecies } from "pokenode-ts";
import { types } from "util";

export async function downloadFile(url: string | null, path: string) {
    if (url == null) return

    const _url = url.split('/')
    const name = _url[_url.length - 1]
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });

        response.data.pipe(fs.createWriteStream(path + name));

    } catch (error) {
        console.error('Error al descargar:', error);
    }
}

export const getMoveWithFormat = (moves: PokemonMove[]) => {
    let movesResult: Obj = {
        // machine: [],
        // tutor: [],
        // egg: [],
        "moveset": []
    }
    for (let m of moves) {
        const moveName = m.move.name
        const version = m.version_group_details.at(-1) // estamos en la primera gen
        if (version == undefined) continue
        switch (version?.move_learn_method.name) {
            // case 'machine':
            //     movesResult.machine.push(`${moveName}`)
            //     break
            // case 'tutor':
            //     movesResult.tutor.push(`${moveName}`)
            //     break
            // case 'egg':
            //     movesResult.egg.push(`${moveName}`)
            //     break
            case 'level-up':
                movesResult["moveset"].push([version.level_learned_at, moveName])
                break
        }
    }
    return movesResult
}

export const getPkmnWithFormat = (pkmn: Pokemon) => {
    return {
        ...pkmn,
        abilities: pkmn.abilities
            .map(a => a.ability.name),
        types: pkmn.types.map(t => t.type.name),
        species: pkmn.species.name,
        cries: undefined,
        forms: undefined,
        game_indices: undefined,
        location_area_encounters: undefined, // pkmn.location_area_encounters TODO fix esto deberia dar el nombre de la area no su url
        moves: undefined,
        past_abilities: undefined,
        past_types: undefined,
        sprites: undefined,
        is_default: undefined,
        order: undefined,
        held_items: undefined,
        stats: pkmn.stats.map(s => s.base_stat),
        effort: pkmn.stats.map(s => s.effort)
    }
}
export const getPkmFormWithFormat = (pkmn: PokemonForm) => {
    return {
        ...pkmn,
        pokemon: pkmn.pokemon.name,
        types: pkmn.types.map(t => t.type.name),
        version_group: undefined,
        version_group_details: undefined,
        order: undefined,
        sprites: undefined,
        name_oficial: pkmn.names.find(n => n.language.name == 'en')?.name,
        names: undefined,
        form_name_oficial: pkmn.form_names.find(n => n.language.name == 'en')?.name,
        form_names: undefined,
    }
}
export const getPkmnSpeciesWithFormat = (species: PokemonSpecies) => {
    return {
        ...species,
        egg_groups: species.egg_groups.map(e => e.name),
        growth_rate: species.growth_rate.name,
        habitat: species.habitat?.name,
        order: undefined,
        pokedex_numbers: undefined,
        evolves_from_species: species.evolves_from_species?.name,
        evolution_chain: undefined,
        names: undefined,
        name_oficial: species.names.find(n => n.language.name == 'en')?.name,

        flavor_text_entries: species.flavor_text_entries.reverse().find(n => n.language.name == 'en')?.flavor_text,
        pal_park_encounters: undefined,
        form_descriptions: undefined,
        genera: undefined,

        color: undefined,
        shape: undefined,
        generation: undefined,
        is_baby: undefined,

        varieties: undefined,
    }
}
export const save = (obj: any, name: string) => {
    fs.writeFileSync(`@data/gen9/${name}.json`, stringify(obj, { indent: 2, maxLength: 100 }))
}

export const load = (file_path: string) => {
    let file = fs.readFileSync(file_path)
    return JSON.parse(file.toString('utf-8'))
}