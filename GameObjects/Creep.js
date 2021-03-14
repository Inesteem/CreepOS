import { INFINITY, PARALLEL_CONTAINER_BUILD_NUM, PATH_REUSE_TICKS, Role } from "../Constants";
import { error } from "../Logging";
import { Frankencreep } from "../FrankenCreep";
import { CreepTask } from "../Task/Task";
import "./Game";
import "./Source";
import "./Room";

Creep.prototype.tasks = [];

Object.defineProperty(Creep.prototype, 'tasks', {
    get: function() {
        let self = this;
        if(!self.memory.tasks) {
            self.memory.tasks = [];
        }
        return self.memory.tasks;
    },
    set: function(value) {
        let self = this;
        self.memory.tasks = value;
    }
});

/** @type {CreepTask} */
Creep.prototype.task;

Object.defineProperty(Creep.prototype, 'task', {
    get: function() {
        let self = this;
        if(!self.tasks.length) {
           return null; 
        }
        return self.tasks[0];
    }
});

Creep.prototype.future_self = {};

Object.defineProperty(Creep.prototype, 'future_self', {
    get: function() {
        let self = this;
        if (self.tasks.length == 0) return null;
        let time = Game.time;
        if (self.tasks.length)
            time += (self.tasks[0].estimated_time - self.memory.ticks);
        for (let i = 1; i < self.tasks.length; ++i) {
            time += self.tasks[i].estimated_time;
        }
        let franky = new Frankencreep(
            new RoomPosition(self.pos.x, self.pos.y, self.pos.roomName),
            self.body.map((part) => part.type),
            self.name
        );
        franky.time = time;
        let creep_after = self.tasks[self.tasks.length - 1].creep_after;
        //_.merge(franky, self.tasks[self.tasks.length - 1].creep_after);
        franky.pos.x = creep_after.pos.x;
        franky.pos.y = creep_after.pos.y;
        franky.pos.roomName = creep_after.pos.roomName;
        franky.store.energy = creep_after.store.energy;
        return franky;
    }
});

Creep.prototype.harvestClosest = function (){
    const target = /** @type {Source | null} */ (this.pos.findClosestByPath(FIND_SOURCES_ACTIVE));
    if(target && this.harvest(target) == ERR_NOT_IN_RANGE) {
        this.moveTo(target, {visualizePathStyle: {stroke: '#ffff00'},reusePath: PATH_REUSE_TICKS});
    }
}

Creep.prototype.harvestFrom = function (target){
    if(target){
        let res = this.harvest(target);
        if (res === ERR_NOT_IN_RANGE || res === ERR_NOT_ENOUGH_RESOURCES) {
            this.moveTo(target, {visualizePathStyle: {stroke: '#ffff00'}, reusePath: PATH_REUSE_TICKS});
            return false;
        }
    }
    return true;
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

/**
 * Finds the optimal place to get energy for this creep.
 * @param {number=} max_time 
 * @param {number=} max_rooms 
 * @return {{type: number, object: RoomObject, path_time: number, harvest_time: (number|undefined)}|null} type is one of FIND_SOURCES, FIND_STRUCTURES, FIND_DROPPED_ENERGY
 */
Creep.prototype.findOptimalEnergy = function(pos, max_time, max_rooms) {
    let needed_energy = this.store.getFreeCapacity(RESOURCE_ENERGY);
    let harvest_time = needed_energy / (2 * this.getActiveBodyparts(WORK));

    let sources = Game.find(
        FIND_SOURCES_ACTIVE,
        {filter : source => harvest_time < INFINITY && (source.hasFreeSpot() || this.pos.inRangeTo(source.pos, 1)) }
    );

    let resources = Game.find(
        FIND_DROPPED_RESOURCES,
        {filter: (resource) => {return resource.amount >= needed_energy && resource.resourceType === RESOURCE_ENERGY}}
    );
    let containers = Game.find(
        FIND_STRUCTURES,
                {filter: (structure) => {
                    return (structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE)
                    && (structure.store[RESOURCE_ENERGY] >= needed_energy)
                }
    }).concat( Game.find (
         FIND_RUINS,
         { filter : (ruin) => ruin.store[RESOURCE_ENERGY] >= needed_energy }
     ))
     .concat ( Game.find (
        FIND_TOMBSTONES,
        { filter : (tombstone) => tombstone.store[RESOURCE_ENERGY] >= needed_energy }
    ));

    let best_target = null;
    let best_time = max_time || undefined;
    
    if (containers.length) {
        let result = pos.findClosestTarget(containers, 1, this.getCostMatrix(), best_time);
        if (result) {
            best_time = result.result.cost;
            best_target = {
                type: FIND_STRUCTURES,
                object: result.target,
                path_time: result.result.cost
            }
        }
    }
    
    if (resources.length && (best_time === undefined || best_time > 0)) {
        let result = pos.findClosestTarget(resources, 1, this.getCostMatrix(), best_time);
        if (result) {
            best_time = result.result.cost;
            best_target = {
                type: FIND_DROPPED_RESOURCES,
                object: result.target,
                path_time: result.result.cost,
            }
        }
    }

    // here best_time is not defined properly so it must be the last if condition in this function 
    if (sources.length && (best_time === undefined || best_time - harvest_time > 0)) {
        let result = pos.findClosestTarget(sources, 1, this.getCostMatrix(), best_time - harvest_time);
        if (result) {
            best_target = {
                type: FIND_SOURCES,
                object: result.target,
                path_time: result.result.cost,
                harvest_time: harvest_time
            }
        }
    }

    return best_target;
}

Creep.prototype.getCostMatrix = function() {
    let fatigue_decrease = this.getActiveBodyparts(MOVE) * 2;
    let fatigue_base = this.body.length - this.getActiveBodyparts(MOVE);
    return Game.getCostMatrix(fatigue_base, fatigue_decrease); 
}

Creep.prototype.getRoadCosts = function() {
    let fatigue_decrease = this.getActiveBodyparts(MOVE) * 2;
    let fatigue_base = this.body.length - this.getActiveBodyparts(MOVE);
    return Math.max(1, fatigue_base - fatigue_decrease);
}

Creep.prototype.getPlainCosts = function() {
    let fatigue_decrease = this.getActiveBodyparts(MOVE) * 2;
    let fatigue_base = this.body.length - this.getActiveBodyparts(MOVE);
    return Math.max(1, 2 * fatigue_base - fatigue_decrease);
}

Creep.prototype.getSwampCosts = function() {
    let fatigue_decrease = this.getActiveBodyparts(MOVE) * 2;
    let fatigue_base = this.body.length - this.getActiveBodyparts(MOVE);
    return Math.max(1, 10 * fatigue_base - fatigue_decrease);
}