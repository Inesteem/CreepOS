import { error } from "./Logging";
import { getOurRooms } from "./Base";
import "./Room";

function findEnemyCreeps(rooms, filter) {
    let enemies = {'all' : [], 'remote_fighters' : [], 'close_fighters' : [], 'healers' : []};
    for (let room of rooms ) {
        let room_enemies = room.findAllHostileCreeps();
        enemies.all             = enemies.all.concat(room_enemies.all);
        enemies.remote_fighters = enemies.remote_fighters.concat(room_enemies.remote_fighters);
        enemies.close_fighters  = enemies.close_fighters.concat(room_enemies.close_fighters);
        enemies.healers         = enemies.healers.concat(room_enemies.healers);
    }
    return enemies;
}

function numCreeps(filter) {
    if (typeof filter !== 'function') {
        error("base.numCreeps: filter is not a function.");
        return 0;
    }
    return Object.values(Game.creeps).filter((creep) => filter(creep)).length;
}

/**
 * 
 * @param {(function(Structure):boolean)=} filter An optional filter.
 * @return {Array<StructureSpawn>} All spawns matching filter.
 */
function getSpawns(filter) {
    let rooms = getOurRooms() || [];
    let spawns = [];

    for (let room of rooms) {
        spawns = spawns.concat(room.find(FIND_MY_STRUCTURES, 
            {filter: (structure) => structure.structureType === STRUCTURE_SPAWN
                && (typeof filter !== 'function' || filter(structure))}));
    }
    return spawns;
}

export { numCreeps, findEnemyCreeps, getSpawns };