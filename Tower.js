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
    
    if (structure) {
        this.repair(structure);
    }
}

StructureTower.prototype.attackClosest = function() {
    let enemy = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    
    if (enemy) {
        this.attack(enemy);
        return true;
    }
    return false;
}

StructureTower.prototype.healClosest = function() {
    let toHeal = base.findCreeps((creep) => creep.hits < creep.hitsMax);
    
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
        if (!tower.attackClosest()) {
            if (!tower.healClosest()) {
                tower.repairClosest();
            }
        }
    });
}

module.exports = {
    operateTowers: operateTowers
};