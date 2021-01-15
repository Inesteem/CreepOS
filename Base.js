import { info, error } from "./Logging";

/**
 * 
 * @param {Room} room 
 */
function getStoresWithEnergy(room) {
    let stores = room.find(FIND_STRUCTURES, {
        filter: (structure) => {
                return (structure.structureType == STRUCTURE_STORAGE ||
                    structure.structureType == STRUCTURE_CONTAINER) &&
                    structure.store[RESOURCE_ENERGY] > 0;
        }
    }); 
    return stores;
}

function handlePossibleRespawn() {
    if (Memory.main_spawn && Memory.main_spawn != Game.spawns['Spawn1'].pos &&
        Object.values(Game.creeps).length === 0) {
        info("Detected respawn!");
        Memory = {};
        Memory.new_tasks = {};
    }
    Memory.new_tasks = Memory.new_tasks || {};
    Memory.main_spawn = Game.spawns['Spawn1'].pos;
}

/**
 * 
 * @param {Creep} creep 
 * @return {Structure} Closest storage structure with free capacity.
 */
function getFreeStore(creep) {
    let storage  = /** @type {Structure} */ (creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (structure) => {
                return (structure.structureType == STRUCTURE_STORAGE ||
                    structure.structureType == STRUCTURE_CONTAINER) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
    }));
    return storage;
}

function findNearestEnergyStored(position) {
    if (!position) {
        error("Called findNearestEnergyStored with underfined position.");
    }
    let store = position.findClosestByPath(FIND_STRUCTURES, {
        filter: (structure) => {
                return (structure.structureType == STRUCTURE_STORAGE ||
                    structure.structureType == STRUCTURE_CONTAINER) &&
                    structure.store[RESOURCE_ENERGY] > 0;
        }
    });
    return store;
}

function getNoOwnerStructures(room, structure_type) {
    let str = room.find(FIND_STRUCTURES, {
            filter: (s) => {
                    return ( s.structureType == structure_type)
                }});
    
    return str;
}

function getTowers(room, filter) {
    let towers = room.find(FIND_MY_STRUCTURES, {
            filter: (tower) => {
                    return ( tower.structureType == STRUCTURE_TOWER) &&
                        filter(tower);
                }});
    
    return towers;
}

function findCreeps(filter) {
    if (typeof filter !== 'function') {
        error("base.findCreeps: filter is not a function.");
        return 0;
    }
    return Object.values(Game.creeps).filter((creep) => filter(creep));
}

function findEnemyCreeps(rooms, filter) {
    let enemies = [];
    
    rooms.forEach(room => {
        const room_enemies =
       enemies = enemies.concat(room.find(FIND_HOSTILE_CREEPS, {
            filter: function(object) {
                return object.getActiveBodyparts(ATTACK) || filter(object) ||
                    object.getActiveBodyparts(RANGED_ATTACK);
            }
       }));
    });
    
    return enemies;
}

function numCreeps(filter) {
    if (typeof filter !== 'function') {
        error("base.numCreeps: filter is not a function.");
        return 0;
    }
    return Object.values(Game.creeps).filter((creep) => filter(creep)).length;
}

function findNearestEnergySource(position) {
    return position.findClosestByPath(FIND_SOURCES_ACTIVE);
}

/**
 * @return {!Array<Room>} Rooms with a flag whose controller is ours.
 */
function getOurRooms() {
    let rooms = Object.values(Game.flags).filter((flag) => flag.room).map((flag) => flag.room).filter((room) => room.controller.my);
    if (!rooms.length) {
        error("No rooms found. Did you forget to set the flag?");
    }
    return rooms || [];
}

/**
 * @return {!Array<Room>} Rooms with a flag whose controller is not ours.
 */
export function getRoomsToClaim() {
    let rooms = Object.values(Game.flags).filter((flag) => flag.room).map((flag) => flag.room).filter((room) => !room.controller.my);
    return rooms || [];
}

function getUnclaimedFlags() {
    return Object.values(Game.flags).filter((flag) => !flag.room);
}


export {
    getFreeStore,
    getOurRooms,
    getUnclaimedFlags,
    findNearestEnergyStored,
    findNearestEnergySource,
    numCreeps,
    getTowers,
    getNoOwnerStructures,
    findCreeps,
    handlePossibleRespawn,
    findEnemyCreeps,
    getStoresWithEnergy,
};





