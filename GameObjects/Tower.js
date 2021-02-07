import "./Game";
 
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
        this.attack(enemy);
        return true;
    }
    return false;
}

StructureTower.prototype.healClosest = function(filter) {
    let toHeal = this.pos.findClosestByRange(FIND_MY_CREEPS, {filter: (creep) => creep.hits < creep.hitsMax && (!filter || filter(creep))});                                         

    if (toHeal) {
        this.heal(toHeal);
        return true;
    }
    return false;
}

function operateTowers() {
    let towers = [];
    let rooms = Game.getOurRooms();
    
    rooms.forEach(room => {
        towers = towers.concat(room.find(FIND_MY_STRUCTURES, {
            filter: (tower) => {
                    return ( tower.structureType == STRUCTURE_TOWER) &&
                        tower.store[RESOURCE_ENERGY] >= 10;
                }
        }));
    });
    
    towers.forEach(tower => {
        if (!tower.room.controller || !tower.room.controller.safeMode){
            
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

export {operateTowers};
