import { ERR_NO_SPAWN } from "../Constants";
import { error, info } from "../Logging";
import "./Game";
import "./Source";

Room.prototype.findAllHostileCreeps = function (){

    let enemies = this.find(FIND_HOSTILE_CREEPS);
    let remote_fighters =   enemies.filter(enemy => enemy.getActiveBodyparts(RANGED_ATTACK));                                                      
    let close_combatants =  enemies.filter(enemy => enemy.getActiveBodyparts(ATTACK));                                                          
    let healers =           enemies.filter(enemy => enemy.getActiveBodyparts(HEAL));   

    return {'all' : enemies, 'remote_fighters' : remote_fighters, 'close_fighters' : close_combatants, 'healers' : healers};
}

/**
 * 
 * @param {(function(Creep):boolean)=} filter 
 */
Room.prototype.numCreeps = function(filter) {
    if (filter && typeof filter !== 'function') {
        error("base.numCreeps: filter is not a function.");
        return 0;
    }
    return Object.values(Game.creeps).filter((creep) => (!filter || filter(creep)) && creep.room === this ).length;
}

/**
 * 
 * @param {(function(Structure):boolean)=} filter 
 * @return {!Array<StructureSpawn>} All spawns matching filter in this room.
 */
Room.prototype.findSpawns = function(filter) {
    let spawns = this.find(FIND_MY_STRUCTURES, 
            {filter: (structure) => structure.structureType === STRUCTURE_SPAWN
                && (typeof filter !== 'function' || filter(structure))});
    return spawns || [];
}

/**
 * 
 * @param {(function(Structure):boolean)=} filter 
 * @return {!Array<Structure>} All hostile structures matching filter in this room.
 */
Room.prototype.getHostileStructures = function(filter) {
    let structures = this.find(FIND_HOSTILE_STRUCTURES, 
            {filter: (structure) =>  (typeof filter !== 'function' || filter(structure))});
    return structures || [];
}
/**
 * @param {{x : number, y : number}} pos
 * @return {boolean}
 */
Room.prototype.inRoom = function(pos) {
    if (pos.x <= 0 || pos.y <= 0) return false;
    if (pos.x >= 49 || pos.y >= 49) return false;
    return true;
}

//TODO : refactor to getUsedCapacity
/**
 * @return {number} The energy available in all containers and storage of the room.
 */
Room.prototype.storedEnergy = function() {
    let containers = this.find(FIND_STRUCTURES, {
        filter: (structure) => structure.structureType === STRUCTURE_CONTAINER 
    }) || [];
    let energy = 0;
    for (let container of containers) {
        energy += container.store[RESOURCE_ENERGY];
    }
    if (this.storage) {
        energy += this.storage.store[RESOURCE_ENERGY];
    }
    return energy;
}

/**
 * @param {string} resource_type The resource type.
 * @return {number} The energy capacity available in all containers and storage of the room.
 */
Room.prototype.getFreeCapacity = function(resource_type) {
    let containers = this.find(FIND_STRUCTURES, {
        filter: (structure) => structure.structureType === STRUCTURE_CONTAINER
    }) || [];
    let free_capacity = 0;
    for (let container of containers) {
        free_capacity += container.store.getFreeCapacity(resource_type);
    }
    free_capacity += !this.storage || this.storage.store.getFreeCapacity(resource_type);
    return free_capacity;
}
/**
 * @param {number} req_energy
 * @return {boolean} True if the room has more energy available in stores or sources than is used.
 */
Room.prototype.hasExcessEnergy = function(req_energy) {
    if (this.storedEnergy() > req_energy) {
        return true;
    }
    let sources = this.find(FIND_SOURCES_ACTIVE);
    for (let source of sources || []) {
       let freeSlot = source.hasFreeSlot(Game.time, Game.time+80, /*energy=*/req_energy);
        if (freeSlot && (!this.controller || this.controller.level < 3 || !source.hasMiner())) return true;
    }
    return false;
}

Room.prototype.spawnKevin = function() {
    let spawns = this.find(FIND_STRUCTURES, {filter: 
        /**
         * 
         * @param {StructureSpawn} structure 
         */
        (structure) => structure.structureType === STRUCTURE_SPAWN && !structure.spawning});
    if (spawns.length) {
        return spawns[0].spawnKevin();
    }
}

Room.prototype.spawnMiner = function() {
    let spawns = this.find(FIND_STRUCTURES, {filter: 
        /**
         * 
         * @param {StructureSpawn} structure 
         */
        (structure) => structure.structureType === STRUCTURE_SPAWN && !structure.spawning});
    if (spawns.length) {
        return spawns[0].spawnMiner();
    }
    return "";
}

Room.prototype.spawnCreep = function(body, name, opt) {
    let spawns = this.find(FIND_STRUCTURES, {filter: 
        /**
         * 
         * @param {StructureSpawn} structure 
         */
        (structure) => structure.structureType === STRUCTURE_SPAWN && !structure.spawning});
    if (spawns.length && spawns[0].allowSpawn()) {
        return spawns[0].spawnCreep(body, name, opt);
    }
    return ERR_NO_SPAWN;
}

Room.prototype.findContainer = function() {
    return this.find(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_CONTAINER}});
}

Room.prototype.allowSpawn = function() {
    var num_creeps = Game.numCreeps();
    var max_cost = this.energyCapacityAvailable;
    var energy = this.energyAvailable;
    let energy_req = num_creeps * num_creeps * num_creeps + 300;
    info("spawn requires energy: ", Math.min(max_cost, energy_req), " we have ", energy, " at ", this);
    return energy >= Math.min(max_cost, energy_req); 
}