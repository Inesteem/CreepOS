import { error } from "./Logging";

Room.prototype.findAllHostileCreeps = function (){

    let enemies = this.find(FIND_HOSTILE_CREEPS);
    let remote_fighters =   enemies.filter(enemy => enemy.getActiveBodyparts(RANGED_ATTACK));                                                      
    let close_combatants =  enemies.filter(enemy => enemy.getActiveBodyparts(ATTACK));                                                          
    let healers =           enemies.filter(enemy => enemy.getActiveBodyparts(HEAL));   

    return {'all' : enemies, 'remote_fighters' : remote_fighters, 'close_fighters' : close_combatants, 'healers' : healers};
}


Room.prototype.numCreeps = function(filter) {
    if (typeof filter !== 'function') {
        error("base.numCreeps: filter is not a function.");
        return 0;
    }
    return Object.values(Game.creeps).filter((creep) => filter(creep) && creep.room === this ).length;
}

/**
 * 
 * @param {(function(Structure):boolean)=} filter 
 * @return {Array<StructureSpawn>} All spawns matching filter in this room.
 */
Room.prototype.getSpawns = function(filter) {
    let spawns = this.find(FIND_MY_STRUCTURES, 
            {filter: (structure) => structure.structureType === STRUCTURE_SPAWN
                && (typeof filter !== 'function' || filter(structure))});
    return spawns;
}

Room.prototype.getHostileStructures = function(filter) {
    let structures = this.find(FIND_HOSTILE_STRUCTURES, 
            {filter: (structure) =>  (typeof filter !== 'function' || filter(structure))});
    return structures;
}