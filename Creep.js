import { PATH_REUSE_TICKS } from "./Constants";
import { error } from "./Logging";
import "./Game";
import "./Source";
import "./Room";

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
 * @return {{type: number, object: RoomObject}|null} type is one of FIND_SOURCES, FIND_STRUCTURES, FIND_DROPPED_ENERGY
 */
Creep.prototype.findOptimalEnergy = function(max_time, max_rooms) {
    let needed_energy = this.store.getFreeCapacity(RESOURCE_ENERGY);
    let harvest_time = needed_energy / (2 * this.getActiveBodyparts(WORK));

    let sources = Game.find(
        FIND_SOURCES_ACTIVE,
        {filter : source => source.hasFreeSpot() || this.pos.inRangeTo(source.pos, 1) }
    );
    let resources = Game.find(
        FIND_DROPPED_RESOURCES,
        {filter: (resource) => resource.amount >= needed_energy}
    );
    let containers = Game.find(
        FIND_STRUCTURES,
                {filter: (structure) => 
                    (structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE)
                    && structure.store[RESOURCE_ENERGY] >= needed_energy}
    // ).concat( Game.find (
    //     FIND_RUINS,
    //     { filter : (ruin) => ruin.store[RESOURCE_ENERGY] >= needed_energy }
    // )).concat ( Game.find (
    //     FIND_TOMBSTONES,
    //     { filter : (tombstone) => tombstone.store[RESOURCE_ENERGY] >= needed_energy }
    );
    let best_target = null;
    let best_time = max_time || Infinity;

    let matrix = this.getCostMatrix();

    let result = PathFinder.search(
        this.pos,
        resources.map( (resource) => { return {pos: resource.pos, range: 0}; }),
        Object.assign(matrix, {maxCost: best_time, maxRooms: max_rooms || 16})
    )
    if (!result.incomplete && result.cost < best_time) {
        best_time = result.cost;
        let position = result.path.pop() || this.pos;
        best_target = {
            type: FIND_DROPPED_RESOURCES,
            object: position
                .lookFor(LOOK_RESOURCES)
                .find(resource => resource.resourceType === RESOURCE_ENERGY)
        };
    }

    result = PathFinder.search(
        this.pos,
        containers.map(container => { return {pos: container.pos, range: 1}; }), 
        Object.assign(matrix, {maxCost: best_time, maxRooms: max_rooms || 16})
    );
    //error(result);
    if (!result.incomplete && result.cost < best_time) {
        best_time = result.cost;
        let position = result.path.pop() || this.pos;
        let targets = position.getAdjacentStructures((obj) => obj.structure.structureType === STRUCTURE_STORAGE || obj.structure.structureType === STRUCTURE_CONTAINER); 
        targets = targets.map((obj) => obj.structure);
        if (targets.length) {
            targets.sort((a,b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]);
            best_target = {
                type: FIND_STRUCTURES,
                object: targets[0],
            };
        }
    }
  
    result = PathFinder.search(
        this.pos,
        sources.map(source => { return {pos: source.pos, range: 1}; }),
        Object.assign(matrix, {maxCost: best_time - harvest_time, maxRooms: max_rooms || 16})
    );
    if (!result.incomplete && result.cost + harvest_time < best_time) {
        best_time = result.cost + harvest_time;
        let position = result.path.pop() || this.pos;
        best_target = {
            type: FIND_SOURCES,
            object: position.getAdjacentSource()
        };
    }
    //error(best_target);

    return best_target;
}

Creep.prototype.getCostMatrix = function() {
    let fatigue_decrease = this.getActiveBodyparts(MOVE) * 2;
    let fatigue_base = this.body.length - this.getActiveBodyparts(MOVE);
    return this.room.getCostMatrix(fatigue_base, fatigue_decrease); 
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