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

RoomPosition.prototype.getAdjacentStructures = function() {
    return Game.rooms[this.roomName]
                .lookForAtArea(LOOK_STRUCTURES,
                    Math.max(0, this.y - 1), 
                    Math.max(0, this.x - 1), 
                    Math.min(49, this.y + 1), 
                    Math.min(49, this.x + 1), true);
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

    return /**@type Source */ (this.findClosestTarget(sources, 1, maxCost || 10000, maxRooms || 4));
}

/**
 * Finds the closest structure matching filter
 * @param {function(Structure):boolean} filter 
 * @param {number} maxCost 
 * @param {number} maxRooms
 * @return {Object} 
 */
RoomPosition.prototype.findClosestStructure = function(filter, maxCost, maxRooms) {
    let rooms = getOurRooms() || [];
    let structures = [];

    for (let room of rooms) {
        structures = structures.concat(room.find(FIND_STRUCTURES, {filter: filter}));
    }

    return this.findClosestTarget(structures, 1, maxCost || 10000, maxRooms || 4);
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
    let bestCost = maxCost || 10000;
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