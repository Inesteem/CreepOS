import { PATH_REUSE_TICKS } from "./Constants";
import { getOurRooms } from "./Base";
import { error } from "./Logging";

Creep.prototype.harvestClosest = function (){
    const target = /** @type {Source | null} */ (this.pos.findClosestByPath(FIND_SOURCES_ACTIVE));
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
    let rooms = getOurRooms() || [];
    let sources = [];
    let resources = [];
    let containers = [];

    let needed_energy = this.store.getFreeCapacity(RESOURCE_ENERGY);
    let harvest_time = needed_energy / (2 * this.getActiveBodyparts(WORK));

    for (let room of rooms) {
        sources = sources.concat(room.find(FIND_SOURCES_ACTIVE));
        resources = resources.concat(room.find(FIND_DROPPED_RESOURCES), {filter: (resource) => {
            return resource.amount >= needed_energy
        }});
        containers = containers.concat(room.find(FIND_STRUCTURES, {filter: (structure) => {
            return (structure.structureType === STRUCTURE_CONTAINER ||
                structure.structureType === STRUCTURE_STORAGE) &&
            structure.store[RESOURCE_ENERGY] >= needed_energy
        }}));
    }

    let best_target = null;
    let best_time = max_time || Infinity;

    let matrix = this.getCostMatrix();

    // TODO?? Didnt work
    // for (let resource of resources) {
    //     //TODO
    //     if (!resource.pos) continue;
    //     let result = PathFinder.search(this.pos, {pos: resource.pos, range: 1}, {maxCost: best_time, maxRooms: max_rooms || 16});
    //     if (result.incomplete) continue;
    //     if (result.cost < best_time) {
    //         best_time = result.cost;
    //         best_target = {type: FIND_DROPPED_RESOURCES, object: resource};
    //     }
    // }

    for (let container of containers) {
        let result = PathFinder.search(this.pos, {pos: container.pos, range: 1}, Object.assign(matrix, {maxCost: best_time, maxRooms: max_rooms || 16}));
        if (result.incomplete) continue;
        if (result.cost < best_time) {
            best_time = result.cost;
            best_target = {type: FIND_STRUCTURES, object: container};
        }
    }

    for (let source of sources) {
        let result = PathFinder.search(this.pos, {pos: source.pos, range: 1}, Object.assign(matrix, {maxCost: best_time - harvest_time, maxRooms: max_rooms || 16}));
        if (result.incomplete) continue;
        if (result.cost + harvest_time < best_time) {
            best_time = result.cost + harvest_time;
            best_target = {type: FIND_SOURCES, object: source};
        }
    }

    return best_target;
}

Creep.prototype.getCostMatrix = function() {
    let fatigue_decrease = this.getActiveBodyparts(MOVE) * 2;
    let fatigue_base = this.body.length - this.getActiveBodyparts(MOVE);
    return {

        plainCost: 2 * fatigue_base - fatigue_decrease,
        swampCost: 10 * fatigue_base - fatigue_decrease,
  
        roomCallback: function(roomName) {
            let costs = new PathFinder.CostMatrix;
            let room = Game.rooms[roomName];
            if (!room) return costs;
  
            room.find(FIND_STRUCTURES).forEach(function(struct) {
                if (struct.structureType === STRUCTURE_ROAD) {
                    // Favor roads over plain tiles
                    let cost = fatigue_base - fatigue_decrease;
                    costs.set(struct.pos.x, struct.pos.y, cost);
                } else if (struct.structureType !== STRUCTURE_CONTAINER &&
                       (struct.structureType !== STRUCTURE_RAMPART ||
                        !struct.my)) {
                    // Can't walk through non-walkable buildings
                    costs.set(struct.pos.x, struct.pos.y, 0xff);
                }
            });
  
            return costs;
        }
    }   
}