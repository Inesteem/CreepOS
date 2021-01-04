/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Tower');
 * mod.thing == 'a thing'; // true
 */
 
var base = require("Base");
 
StructureTower.prototype.repairClosest = function() {
    let structure = this.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: object => object.hits && object.hits < object.hitsMax
    });
    
    if (structure && structure.structureType != STRUCTURE_WALL) {
        this.repair(structure);
    }
}

StructureTower.prototype.attackClosest = function() {
    let enemy = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
        filter: creep => creep.pos.x > 0 && creep.pos.y > 0 && 
                      creep.pos.y < 49 && creep.pos.x < 49});
    
    if (enemy) {
        this.attack(eynemy);
        return true;
    }
    return false;
}

StructureTower.prototype.healClosest = function(filter) {
    let toHeal = base.findCreeps((creep) => creep.hits < creep.hitsMax && filter(creep));                                           

    if (toHeal.length) {
        this.heal(toHeal[0]);
        return true;
    }
    return false;
}

function operateTowers() {
    let towers = [];
    let rooms = base.getOurRooms();
    
    rooms.forEach(room => {
        towers = towers.concat(room.find(FIND_MY_STRUCTURES, {
            filter: (tower) => {
                    return ( tower.structureType == STRUCTURE_TOWER) &&
                        tower.store[RESOURCE_ENERGY] >= 10;
                }
        }));
    });
    
    towers.forEach(tower => {
        if (!tower.room.controller.safeMode){
            
            if(!tower.healClosest((creep) =>  creep.getActiveBodyparts(RANGED_ATTACK) || 
                                            creep.getActiveBodyparts(ATTACK) || 
                                            creep.getActiveBodyparts(HEAL))){
                    if (!tower.attackClosest()){ 
                        if(!tower.healClosest((creep) => true)){
                        tower.repairClosest();
                    }
                }
            }  
        } else {
            if (!tower.repairClosest()) {
                if (!tower.healClosest()) {
                    tower.attackClosest((creep) => true);
                }
            }
        }
    });
}

module.exports = {
    operateTowers: operateTowers
};
