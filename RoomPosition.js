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