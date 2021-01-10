import { getOurRooms } from "./Base";

RoomPositio.prototype.getAdjacentContainer = function(filter) {
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
 */
RoomPosition.prototype.findClosestActiveSource = function(maxCost, maxRooms) {
    let rooms = getOurRooms() = [];
    let sources = [];

    for (let room of rooms) {
        sources = sources.concat(room.find(FIND_SOURCES_ACTIVE));
    }

    return this.findClosestTarget(sources, maxCost || 1000, maxRooms || 4);
}

RoomPosition.prototype.findClosestTarget = function(targets, maxCost, maxRooms) {
    if (!targets || !targets.length) return null;

    let bestTarget = null;
    let bestCost = maxCost;
    for (let target of targets) {
        let result = PathFinder.search(this, target.pos, {maxCost: bestCost, maxRooms: maxRooms});
        if (result.incomplete) continue;
        if (result.cost < bestCost) { // This should always be the case.
            bestCost = result.cost;
            bestTarget = target;
        }
    }

    return target;
}