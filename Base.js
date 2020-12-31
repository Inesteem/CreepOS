var log = require("Logging");

function handlePossibleRespawn() {
    if (Memory.main_spawn && Memory.main_spawn != Game.spawns['Spawn1'].pos &&
        Game.creeps.length == 0) {
        log.info("Detected respawn!");
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
        log.error("Called findNearestEnergyStored with underfined position.");
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
        log.error("base.findCreeps: filter is not a function.");
        return 0;
    }
    return _.filter(Game.creeps, (creep) => filter(creep));
}

/**
 * @param {Array<Room>} rooms The rooms to search.
 * @param {Creep -> bool} filter The filter to apply when searching for enemy creeps.
 * @return {Array<Creep>} All enemies in the given rooms matching filter.
 */
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
        log.error("base.numCreeps: filter is not a function.");
        return 0;
    }
    return _.filter(Game.creeps, (creep) => filter(creep)).length;
}

var findNearestEnergySource = function(position) {
    return position.findClosestByPath(FIND_SOURCES_ACTIVE);
}

var getOurRooms = function() {
    let rooms = _.filter(Game.flags, (flag) => flag.room).map((flag) => flag.room);
    if (!rooms.length) {
        log.error("No rooms found. Did you forget to set the flag?");
    }
    return rooms;
}

var getUnclaimedFlags = function() {
    return _.filter(Game.flags, (flag) => !flag.room);
}

module.exports = {
    getFreeStore: getFreeStore,
    getOurRooms: getOurRooms,
    getUnclaimedFlags: getUnclaimedFlags,
    findNearestEnergyStored: findNearestEnergyStored,
    findNearestEnergySource: findNearestEnergySource,
    numCreeps: numCreeps,
    getTowers: getTowers,
    getNoOwnerStructures: getNoOwnerStructures,
    findCreeps: findCreeps,
    handlePossibleRespawn: handlePossibleRespawn,
    findEnemyCreeps: findEnemyCreeps,
};