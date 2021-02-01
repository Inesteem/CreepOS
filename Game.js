import { error } from "./Logging";
import "./Room";

export function initGame() {
    /**
    * @return {!Array<Room>} Rooms with a flag whose controller is ours.
    */
    Game.getOurRooms = function() {
        let rooms = Object.values(Game.flags).filter((flag) => flag.room).map((flag) => flag.room).filter((room) => room.controller && room.controller.my);
        if (!rooms.length) {
            error("No rooms found. Did you forget to set the flag?");
        }
        return rooms || [];
    }

    /**
     * Calls room.find(type, opts) on all our rooms.
     * @param {number} type One of the FIND_* constants
     * @param {Object=} opts Options for room.find
     */
    Game.find = function(type, opts) {
        let objects = [];
        let rooms = Game.getOurRooms();
        for (let room of rooms) {
            objects = objects.concat(room.find(type, opts));
        }
        return objects;
    }
}


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

function storedEnergy() {
    let rooms = Game.getOurRooms();
    let energy = 0;
    for (let room of rooms) {
        energy += room.storedEnergy();
    }
    return energy;
}

/**
 * 
 * @param {function(Creep):boolean=} filter 
 * @return {number} The number of all creeps.
 */
function numCreeps(filter) {
    if (filter && typeof filter !== 'function') {
        error("numCreeps: filter is not a function.");
        return 0;
    }
    return Object.values(Game.creeps).filter((creep) => !filter || filter(creep)).length;
}

/**
 * 
 * @param {(function(Structure):boolean)=} filter An optional filter.
 * @return {Array<StructureSpawn>} All spawns matching filter.
 */
function getSpawns(filter) {
    let rooms = Game.getOurRooms();
    let spawns = [];

    for (let room of rooms) {
        spawns = spawns.concat(room.find(FIND_MY_STRUCTURES, 
            {filter: (structure) => structure.structureType === STRUCTURE_SPAWN
                && (typeof filter !== 'function' || filter(structure))}));
    }
    return spawns;
}

/**
 * 
 * @return {StructureSpawn} the spawn with the most extensions.
 */
function getBiggestSpawn() {
    //TODO
    return Game.spawns["Spawn1"];
}





export { numCreeps, findEnemyCreeps, getSpawns, getBiggestSpawn, storedEnergy };