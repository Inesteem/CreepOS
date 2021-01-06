import { info, error } from "./Logging";

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
        Game.creeps.length == 0) {
        info("Detected respawn!");
        Memory = {};
        Memory.tasks = [];
    }
    Memory.tasks = Memory.tasks || [];
    Memory.main_spawn = Game.spawns['Spawn1'].pos;
}

var getFreeStore = function(creep) {
    let storage  = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (structure) => {
                return (structure.structureType == STRUCTURE_STORAGE ||
                    structure.structureType == STRUCTURE_CONTAINER) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
    });
    return storage;
}

var findNearestEnergyStored = function(position) {
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
    return Game.creep.values().filter((creep) => filter(creep));
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
    return Game.creeps.values().filter((creep) => filter(creep)).length;
}

var findNearestEnergySource = function(position) {
    return position.findClosestByPath(FIND_SOURCES_ACTIVE);
}

var getOurRooms = function() {
    let rooms = Game.flags.values().filter((flag) => flag.room).map((flag) => flag.room);
    if (!rooms.length) {
        error("No rooms found. Did you forget to set the flag?");
    }
    return rooms;
}

var getUnclaimedFlags = function() {
    return Game.flags.values().filter((flag) => !flag.room);
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