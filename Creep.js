import { PATH_REUSE_TICKS } from "./Constants";

Creep.prototype.harvestClosest = function (){
    const target = this.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
    if(target && this.harvest(target) == ERR_NOT_IN_RANGE) {
        this.moveTo(target, {visualizePathStyle: {stroke: '#ffff00'},reusePath: PATH_REUSE_TICKS});
    }
}

Creep.prototype.harvestFrom = function (target){
    if(target && this.harvest(target) == ERR_NOT_IN_RANGE) {
        this.moveTo(target, {visualizePathStyle: {stroke: '#ffff00'}, reusePath: PATH_REUSE_TICKS});
    }
}

Creep.prototype.takeFrom = function(structure) {
    if (this.withdraw(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        this.moveTo((structure), {visualizePathStyle: {stroke: '#555500'}, reusePath: PATH_REUSE_TICKS});
    }
}

Creep.prototype.storeAt = function(structure) {
    if(this.transfer(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        this.moveTo(structure, {visualizePathStyle: {stroke: '#ff00ff'},reusePath: PATH_REUSE_TICKS});
    }
}

Creep.prototype.upgrade = function(controller) {
    if(this.upgradeController(controller) == ERR_NOT_IN_RANGE) {
        this.moveTo(controller, {visualizePathStyle: {stroke: '#00ffff'},reusePath: PATH_REUSE_TICKS});
    }
}

Creep.prototype.buildStructure = function(structure) {
    if(this.build(structure) == ERR_NOT_IN_RANGE) {
        this.moveTo(structure, {visualizePathStyle: {stroke: '#0000ff'}, reusePath: PATH_REUSE_TICKS});
    }
}

Creep.prototype.collectDroppedResource = function(resource) {
    let res = this.pickup(resource) 
    if(res == ERR_NOT_IN_RANGE) {
        this.moveTo(resource, {visualizePathStyle: {stroke: '#00ff00'}, reusePath: PATH_REUSE_TICKS});
    }
    this.say("collecting");
    //this.say(this.pickup(resource) + " " + this.memory.task.pos.x + "," + this.memory.task.pos.y);
    return res;
    
}

Creep.prototype.repairStructure = function(structure) {
    if(this.repair(structure) == ERR_NOT_IN_RANGE) {
        this.moveTo(structure, {visualizePathStyle: {stroke: '#00ff00'}, reusePath: PATH_REUSE_TICKS});
    }
}

Creep.prototype.claimRoom = function() {
    if(this.claimController(this.room.controller) == ERR_NOT_IN_RANGE) {
        this.moveTo(this.room.controller, {visualizePathStyle: {stroke: '#ffffff'}, reusePath: PATH_REUSE_TICKS});
    }
}

Creep.prototype.moveToRoom = function(flag) {
    if(this.room != flag.room) {
        this.moveTo(flag, {visualizePathStyle: {stroke: '#000000'}, reusePath: PATH_REUSE_TICKS});
        return false;
    }
    return true;
}

Creep.prototype.activateSafeMode = function(room) {
    if(this.generateSafeMode(room.controller) == ERR_NOT_IN_RANGE) {
        this.moveTo(room.controller, {reusePath: PATH_REUSE_TICKS});
    }
}


Creep.prototype.fight = function(target) {
    if(target) {
        if(this.attack(target) == ERR_NOT_IN_RANGE) {
            this.moveTo(target,  {visualizePathStyle: {stroke: '#ff0000'}, reusePath: PATH_REUSE_TICKS});
        }
    }
}

Creep.prototype.shoot = function(target) {
    //const target = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if(target) {
        if(this.rangedAttack(target) == ERR_NOT_IN_RANGE) {
            this.moveTo(target, {visualizePathStyle: {stroke: '#ff0000'}, reusePath: PATH_REUSE_TICKS});
        }
    }
}

Creep.prototype.moveAwayFrom = function(target, range) {
    let result = PathFinder.search(this.pos, {pos: target.pos, range: range}, {flee: true});
    let dir = result.path[0];
    this.move(this.pos.getDirectionTo(dir));
}