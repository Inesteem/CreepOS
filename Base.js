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

var findNearestEnergyStored = function(object) {
    let store = object.pos.findClosestByPath(FIND_STRUCTURES, {
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
    return _.filter(Game.creeps, (creep) => filter(creep));
}

function numCreeps(filter) {
    return _.filter(Game.creeps, (creep) => filter(creep)).length;
}

var findNearestEnergySource = function(object) {
    return object.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
}

var getOurRooms = function() {
    return _.filter(Game.flags, (flag) => flag.room).map((flag) => flag.room);
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
};