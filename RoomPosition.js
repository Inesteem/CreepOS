import { getOurRooms } from "./Base";
import { error } from "./Logging";

RoomPosition.prototype.getAdjacentContainer = function(filter) {
    let structures = this.getAdjacentStructures();
    for (let structure of structures) {
        if (structure.structure.structureType == STRUCTURE_CONTAINER && 
                filter(structure.structure)) {
            return structure.structure;
        }
    }
    return null;
}

RoomPosition.prototype.getAdjacentSource = function(filter) {
    let sources = Game.rooms[this.roomName]
                    .lookForAtArea(LOOK_SOURCES,
                        Math.max(0, this.y - 1), 
                        Math.max(0, this.x - 1), 
                        Math.min(49, this.y + 1), 
                        Math.min(49, this.x + 1), true);
    for (let source of sources) {
        if (filter(source.source)) return source.source;
    }
    return null;
}

RoomPosition.prototype.getAdjacentWalkables = function() {
    let positions = [];
    for (let dx = -1; dx <= 1; ++dx) {
        for (let dy = -1; dy <= 1; ++dy) {
            if(dy == 0 && dx == 0) continue;
            let position = new RoomPosition(this.x + dx, this.y + dy, this.roomName);
            let room = Game.rooms[this.roomName];
            if (room.inRoom(position) && position.isWalkable()) {
                positions.push(position);
            }
        }
    }
    return positions;
}

/**
 * @return {boolean} Whether a creep can step on this field now.
 */
RoomPosition.prototype.isWalkable = function() {
    if (!this.isGenerallyWalkable()) return false;

    let creeps = this.lookFor(LOOK_CREEPS);
    if (creeps.length) return false;
    return true;
}

/**
 * @return {boolean} Whether this field is theoretically walkable, might be blocked by creep.
 */
RoomPosition.prototype.isGenerallyWalkable = function() {
    let terrain = this.lookFor(LOOK_TERRAIN);
    if (terrain == 'wall') {
       return false;
    }
    
    let structures = this.lookFor(LOOK_STRUCTURES).concat(this.lookFor(LOOK_CONSTRUCTION_SITES));
    for (let structure of structures) {
        if (OBSTACLE_OBJECT_TYPES.find((type) => type === structure.structureType)) {
            return false;
        }
    }
    return true;
}

RoomPosition.prototype.getAdjacentStructures = function() {
    return Game.rooms[this.roomName]
                .lookForAtArea(LOOK_STRUCTURES,
                    Math.max(0, this.y - 1), 
                    Math.max(0, this.x - 1), 
                    Math.min(49, this.y + 1), 
                    Math.min(49, this.x + 1), true);
}

/**
 * 
 * @param {RoomPosition} pos
 * @param {number} range 
 * @param {number=} fatigue_base this.body.length - this.getActiveBodyparts(MOVE)
 * @param {number=} fatigue_decrease this.getActiveBodyparts(MOVE) * 2
 * @param {number=} maxCost 
 * @param {number=} maxRooms
 * @return {number} Infinity if cost > maxcost, else cost
 */
RoomPosition.prototype.getPathCosts = function(pos, range, fatigue_base, fatigue_decrease, maxCost, maxRooms) {
    let cost_matrix = Game.rooms[this.roomName].getCostMatrix(fatigue_base, fatigue_decrease);
    let result = PathFinder.search(this, {pos: pos, range: range}, Object.assign(cost_matrix, {maxCost: maxCost || 2000, maxRooms: maxRooms || 16}));
    if (result.incomplete) {
        return Infinity;
    }
    let value = result.cost;
    return value;
}

/**
 * Finds the closest of all sources in our rooms. (Slow?)
 * @param {number=} maxCost
 * @param {number=} maxRooms
 * @return {Source} The closest source or null if none is in range.
 */
RoomPosition.prototype.findClosestActiveSource = function(maxCost, maxRooms) {
    let rooms = getOurRooms() || [];
    let sources = [];

    for (let room of rooms) {
        sources = sources.concat(room.find(FIND_SOURCES_ACTIVE));
    }

    return /**@type Source */ (this.findClosestTarget(sources, 1, maxCost || 2000, maxRooms || 16));
}

/**
 * Finds the closest structure matching filter
 * @param {function(Structure):boolean} filter 
 * @param {number=} maxCost 
 * @param {number=} maxRooms
 * @return {Object} 
 */
RoomPosition.prototype.findClosestStructure = function(filter, maxCost, maxRooms) {
    let rooms = getOurRooms() || [];
    let structures = [];

    for (let room of rooms) {
        structures = structures.concat(room.find(FIND_STRUCTURES, {filter: filter}));
    }

    return this.findClosestTarget(structures, 1, maxCost || 2000, maxRooms || 16);
}

/**
 * 
 * @param {Array<{pos: RoomPosition}>} targets
 * @param {number=} range 
 * @param {number=} maxCost 
 * @param {number=} maxRooms
 * @return {Object} The closest target or null if none is in range. 
 */
RoomPosition.prototype.findClosestTarget = function(targets, range, maxCost, maxRooms) {
    if (!targets || !targets.length) return null;

    let bestTarget = null;
    let bestCost = maxCost || 2000;
    for (let target of targets) {
        let result = PathFinder.search(this, {pos: target.pos, range: range}, {maxCost: bestCost, maxRooms: maxRooms || 10});
        if (result.incomplete) continue;
        if (result.cost < bestCost) { // This should always be the case.
            bestCost = result.cost;
            bestTarget = target;
        }
    }

    return bestTarget;
}