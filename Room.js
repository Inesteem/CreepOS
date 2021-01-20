import { ERR_NO_SPAWN } from "./Constants";
import { error } from "./Logging";
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
Room.prototype.getSpawns = function(filter) {
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

/**
 * @return {number} The energy available in all containers and storage of the room.
 */
Room.prototype.storedEnergy = function() {
    let containers = this.find(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_CONTAINER}}) || [];
    let energy = 0;
    for (let container of containers) {
        energy += container.store[RESOURCE_ENERGY];
    }
    energy += !this.storage || this.storage.store[RESOURCE_ENERGY];
    return energy;
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
        // TODO reserve energy in the sources.
        if (source.hasFreeSpot()) return true;
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
        spawns[0].spawnKevin();
    }
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