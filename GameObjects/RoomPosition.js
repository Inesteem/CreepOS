import { INFINITY, TERRAIN_PLAIN, TERRAIN_SWAMP, TERRAIN_WALL } from "../Constants";
import { error } from "../Logging";

RoomPosition.prototype.getAdjacentContainer = function(filter) {
    let structures = this.getAdjacentStructures();
    for (let structure of structures) {
        if (structure.structure.structureType === STRUCTURE_CONTAINER && 
                filter(structure.structure)) {
            return structure.structure;
        }
    }
    return null;
}
/**
 * 
 * @param {function(Source):boolean=} filter 
 */
RoomPosition.prototype.getAdjacentSource = function(filter) {
    let sources = Game.rooms[this.roomName]
                    .lookForAtArea(LOOK_SOURCES,
                        Math.max(0, this.y - 1), 
                        Math.max(0, this.x - 1), 
                        Math.min(49, this.y + 1), 
                        Math.min(49, this.x + 1), true);
    for (let source of sources) {
        if (!filter || filter(source.source)) return source.source;
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

RoomPosition.prototype.getAdjacentGenerallyWalkables = function() {
    let positions = [];
    for (let dx = -1; dx <= 1; ++dx) {
        for (let dy = -1; dy <= 1; ++dy) {
            if(dy == 0 && dx == 0) continue;
            let position = new RoomPosition(this.x + dx, this.y + dy, this.roomName);
            let room = Game.rooms[this.roomName];
            if (room.inRoom(position) && position.isGenerallyWalkable()) {
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
    let terrains = this.lookFor(LOOK_TERRAIN);
    for (let terrain of terrains) {
        if (terrain === TERRAIN_WALL) {
            return false;
         }
    }
    
    let structures = this.lookFor(LOOK_STRUCTURES).concat(this.lookFor(LOOK_CONSTRUCTION_SITES));
    for (let structure of structures) {
        if (OBSTACLE_OBJECT_TYPES.find((type) => type === structure.structureType)) {
            return false;
        }
    }
    return true;
}

/**
 * 
 * @param {(function({structure : Structure}):boolean)=} filter 
 */
RoomPosition.prototype.getAdjacentStructures = function(filter) {
    filter = filter || ((s) => true);
    return Game.rooms[this.roomName]
                .lookForAtArea(LOOK_STRUCTURES,
                    Math.max(0, this.y - 1), 
                    Math.max(0, this.x - 1), 
                    Math.min(49, this.y + 1), 
                    Math.min(49, this.x + 1), true)
                .filter(filter);
}


/**
 * 
 * @param {RoomPosition} pos
 * @param {number} range 
 * @param {Creep} creep
 * @param {number=} maxCost 
 * @param {number=} maxRooms
 * @this {RoomPosition}
 * @return {number} INFINITY if cost > maxcost, else estimated path costs
 */
RoomPosition.prototype.estimatePathCosts = function(pos, range, creep, maxCost, maxRooms) {
    range = 1;
    let self = this;
    // Save how often path costs was called for room areas.
    Memory.estimatePathCosts = Memory.estimatePathCosts || {};
    if (!Memory.estimatePathCosts[self.roomName]) {
        initializePathCostCache(self.roomName);
    }
    if (!Memory.estimatePathCosts[pos.roomName]) {
        initializePathCostCache(pos.roomName);
    }
    let posX = Math.floor(pos.x/10);
    let posY = Math.floor(pos.y/10);
    let selfX = Math.floor(self.x/10);
    let selfY = Math.floor(self.y/10);
    let posIdx = posX + posY*10;
    let selfIdx = selfX + selfY*10;

    if (selfIdx != posIdx || self.roomName != pos.roomName){
        let costs = computeCostsFromCache(self.roomName, selfIdx, pos.roomName, posIdx, creep);
        if (costs != -1){
            return costs;
        }
    }

    let callsA=Memory.estimatePathCosts[pos.roomName][posX][posY]++;
    let callsB=Memory.estimatePathCosts[self.roomName][selfX][selfY]++;
   
    let cost_matrix = Game.rooms[this.roomName].getCostMatrix();
    let result = PathFinder.search(self, {pos: pos, range: range}, Object.assign(cost_matrix, {maxCost: maxCost || 2000, maxRooms: maxRooms || 16}));
    if (result.incomplete) {
        return INFINITY;
    }
    let cache_path = computeCachePathFromPath(result.path || []);
    let costs = computeCostsFromPath(cache_path, creep);

    let thresh = 100;
    if (callsA > thresh && callsB > thresh && (selfIdx != posIdx || self.roomName != pos.roomName)){       
        setCachedPath(self.roomName, selfIdx, pos.roomName, posIdx, cache_path);
        setCachedPath(pos.roomName, posIdx, self.roomName, selfIdx, cache_path);
        Memory.estimatePathCosts[pos.roomName][posX][posY] = 0;
        Memory.estimatePathCosts[self.roomName][selfX][selfY] = 0;
    }
    
    return costs;
}

/**
 * 
 * @param {!Array<RoomPosition>} path 
 */
function computeCachePathFromPath(path) {
    let result = {num_road: 0, num_plain: 0, num_swamp: 0};
    for (let pos of path) {
        let terrains = pos.lookFor(LOOK_TERRAIN);
        let structures = pos.lookFor(LOOK_STRUCTURES).concat(pos.lookFor(LOOK_CONSTRUCTION_SITES));
        let done = false;
        for (let structure of structures) {
            if (structure.structureType === STRUCTURE_ROAD) {
                result.num_road++;
                done = true;
                break;
            }
        }
        for (let terrain of terrains) {
            if (!done) {
                if (terrain === TERRAIN_SWAMP) {
                    result.num_swamp++;
                } else if (terrain === TERRAIN_PLAIN) {
                    result.num_plain++;
                }
            }
        }
    }
    return result;
}

function computeCostsFromCache(roomNameA, idxA, roomNameB, idxB, creep) {
    let path = getCachedPath(roomNameA, idxA, roomNameB, idxB);
    if (!path) {
        return -1;
    }
    return computeCostsFromPath(path, creep);
}

/**
 * 
 * @param {{num_road: number, num_plain: number, num_swamp: number}} path 
 * @param {Creep} creep 
 * @return {number}
 */
function computeCostsFromPath(path, creep) {
    return (path.num_road * creep.getRoadCosts() + path.num_plain * creep.getPlainCosts() + path.num_swamp * creep.getSwampCosts());
}


function setCachedPath(roomNameA, idxA, roomNameB, idxB, path) {
    Memory.path_costs = Memory.path_costs || {};
    Memory.path_costs[roomNameA] = Memory.path_costs[roomNameA] || {};
    Memory.path_costs[roomNameA][idxA] = Memory.path_costs[roomNameA][idxA] || {};  
    Memory.path_costs[roomNameA][idxA][roomNameB] = Memory.path_costs[roomNameA][idxA][roomNameB] || {};  
    Memory.path_costs[roomNameA][idxA][roomNameB][idxB] = Memory.path_costs[roomNameA][idxA][roomNameB][idxB] || {};
    Memory.path_costs[roomNameA][idxA][roomNameB][idxB] = path;
}

function getCachedPath(roomNameA, idxA, roomNameB, idxB) {
    if (!Memory.path_costs
        || !Memory.path_costs[roomNameA]
        || !Memory.path_costs[roomNameA][idxA]
        || !Memory.path_costs[roomNameA][idxA][roomNameB]
        || !Memory.path_costs[roomNameA][idxA][roomNameB][idxB]) {
            return null;
    }
    return Memory.path_costs[roomNameA][idxA][roomNameB][idxB];
}

function initializePathCostCache(roomName) {
    Memory.estimatePathCosts[roomName] = [];
    for (let x = 0; x < 10; ++x) {
        Memory.estimatePathCosts[roomName].push([]);
        for (let y = 0; y < 10; ++y){
            Memory.estimatePathCosts[roomName][x].push(0);
        }
    }
}

/**
 * Finds the closest of all sources in our rooms. (Slow?)
 * @param {number=} maxCost
 * @param {number=} maxRooms
 * @return {Source} The closest source or null if none is in range.
 */
RoomPosition.prototype.findClosestActiveSource = function(maxCost, maxRooms) {
    let rooms = Game.getOurRooms() || [];
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
    let rooms = Game.getOurRooms() || [];
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