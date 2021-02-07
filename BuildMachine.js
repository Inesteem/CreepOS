import { getTowers } from "./Base";
import { AUTOMATIC_ROAD_BUILD_TICKS, AUTOMATIC_ROAD_BUILD_NUM } from "./Constants";
import { info, error } from "./Logging";
import "./GameObjects/Game";

function monitor() {
    monitorBuildRoadTasks();
    if (Game.time % 100 == 0) {
        monitorExtensionBuilding();
        monitorBuildContainer();
        monitorTowerBuilding();
    }
}

function findCentralPoint(positions) {
    let x0 = 0, y0 = 0;
    for (let i = 0; i < positions.length; i++) {
        x0 += positions[i].x;
        y0 += positions[i].y;
    }
    x0 = parseInt(x0 / positions.length, 10);
    y0 = parseInt(y0 / positions.length, 10);
    return {x: x0, y: y0};
}

/**
 * 
 * @param {RoomPosition} position 
 * @param {function(RoomPosition):boolean} filter
 * @return {RoomPosition | null} 
 */
function findClosestValidPosition(position, filter) {
    for (let d = 0; d < 50; ++d){
        for (let dx = -d; dx <= d; ++dx){
            for (let dy = -d; dy <= d; ++dy){
                if (dx != d && dy != d && dx != -d && dy != -d) continue;
                if (!Game.rooms[position.roomName].inRoom({x: position.x + dx, y: position.y + dy})) continue;
                let pos = new RoomPosition(position.x + dx, position.y + dy, position.roomName);
                if (filter(pos)){
                    return pos;
                }
            }
        }
    }
    return null;
}

/**
 * Checks that position has at least dist distance from important positions:
 * every building that's not a road, Sources, Minerals
 * @param {RoomPosition} position
 * @param {number} dist Minimal distance from important positions. 
 * @return {boolean}
 */
function hasDistance(position, dist) {
    let room = Game.rooms[position.roomName];

    let structures = room.find(FIND_STRUCTURES, {filter : (structure) =>
        structure.structureType != STRUCTURE_ROAD
    });
    let construction_sites = room.find(FIND_CONSTRUCTION_SITES, {filter : (structure) =>
        structure.structureType != STRUCTURE_ROAD
    });
    let minerals = room.find(FIND_MINERALS);
    let sources = room.find(FIND_SOURCES);
    for (let obj_pos of (structures.concat(construction_sites).concat(minerals).concat(sources)).map((obj) => obj.pos)) {
        if (position.inRangeTo(obj_pos, dist)) return false;
    }
    return true;
}



// EXTENSION BUILDING

function monitorExtensionBuilding() {
    let rooms = Game.getOurRooms();

    for (let room of rooms) {
        if (canBuildExtension(room)) {
            let sources = room.find(FIND_SOURCES);
            let central_point = findCentralPoint(sources.map((source) => source.pos));
            let x0 = central_point.x;
            let y0 = central_point.y;
            let x = 0, y = 0, n = 0;
            while (true) {
                n++;
                if (n > 1000) {
                    break;
                }
                let xp = x0 + x;
                let yp = y0 + y;
                if (xp > 0 && xp < 49 && yp > 0 && yp < 49) {
                    let e = true;
                    let position = new RoomPosition(xp, yp, room.name);
                    if (position.getAdjacentWalkables().length < 5) {
                        e = false;
                    }
                    for (let structure of room.find(FIND_STRUCTURES,
                        {
                            filter: (structure) => structure.structureType === STRUCTURE_SPAWN ||
                                structure.structureType === STRUCTURE_STORAGE ||
                                structure.structureType === STRUCTURE_TOWER ||
                                structure.structureType === STRUCTURE_CONTAINER ||
                                structure.structureType === STRUCTURE_WALL
                        }) || []) {
                        if (structure.pos.getRangeTo(xp, yp) < 3) e = false;
                    }
                    for (let source of sources || []) {
                        //error(source);
                        if (source.pos.getRangeTo(xp, yp) < 3) e = false;
                    }
                    if (e) {
                        let j = room.createConstructionSite(xp, yp, STRUCTURE_EXTENSION);
                        if (j === OK) break;
                    }
                }
                [x, y] = walk45DegRect(x, y);
            }
        }
    }
}

function canBuildExtension(room) {
    let maxExtensions = CONTROLLER_STRUCTURES.extension[room.controller.level];
    let curExtensions = room.find(FIND_STRUCTURES, {filter: { structureType : STRUCTURE_EXTENSION}}).length;
    if (curExtensions < maxExtensions) return true;
    return false;
}

function walk45DegRect(x, y) { // walk in diagonal steps around x = 0, y = 0
    if (x === 0 && y === 0) x = -2;
    if (x < 0 && y >= 0) {
        x++; y++;
    } else if (x >= 0 && y > 0) {
        x++; y--;
    } else if (x > 0 && y <= 0) {
        x--; y--;
    } else if (x <= 0 && y < 0) {
        x--; y++;
        if (x < 0 && y == 0) x -= 2;
    }
    return [x, y];
}

// CONTAINER BUILDING

function monitorBuildContainer() {
    let rooms = Game.getOurRooms();
    for (let room of rooms) {
        let num_container = room.find(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_CONTAINER}}).length;
        let num_container_constr = room.find(FIND_CONSTRUCTION_SITES, {filter: {structureType: STRUCTURE_CONTAINER}}).length;
        if (num_container + num_container_constr < 5) {
            placeContainers(room);
        }
    }
}
/**
 * 
 * @param {Room} room 
 */
function placeContainers(room) {
    let sources = room.find(FIND_SOURCES) || [];
    for (let source of sources){
l1:     for (let d = 1; d < 4; ++d){
            for (let dx = -d; dx <= d; ++dx){
                for (let dy = -d; dy <= d; ++dy){
                    let pos = {x: source.pos.x + dx, y: source.pos.y + dy};
                    if (room.inRoom(pos)){
                        let j = room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER);
                        if (j === OK) break l1;
                        else if (j === ERR_RCL_NOT_ENOUGH || j === ERR_FULL) return;
                        else if (j === ERR_INVALID_TARGET) continue;
                        else error("BM.placeContainers: invalid return value");
                    }
                }
            }
        }
    }
}

// ROAD BUILDING

function max_road_number(room) {
    return 1.0 *
        Game.numCreeps((creep) => true) *
        (getTowers(room, (tower) => true).length + 1);
}
 
//function road_build_ratio(room) {
//    let num_roads = room.find(FIND_STRUCTURES, {
//            filter: (structure) => structure.structureType == STRUCTURE_ROAD
//    }).length;
//    let x = ((num_roads+1)/max_road_number(room));
//    let y = x*x*x;
//    return y;
//}

function monitorBuildRoadTasks() {
    if (typeof Memory.road_build_counter !== 'number') {
        Memory.road_build_counter = 0;
    }
    //if (Memory.road_build_counter%10 == 0)
    //    console.log("road_ticks: " + Memory.road_build_counter + " of " + constants.AUTOMATIC_ROAD_BUILD_TICKS 
    //    + " ratio: " + road_build_ratio(Game.spawns['Spawn1'].room) );
    Memory.road_build_counter++;
    snapshot();
    if (Memory.road_build_counter > AUTOMATIC_ROAD_BUILD_TICKS) {
        for (let room of Game.getOurRooms() || []) {
            createBuildRoadTasks(room);
        }
        Memory.road_build_counter = 0;
    }
}

function snapshot() {
    if (!Memory.roads) {
        Memory.roads = new Map();
    }
    for (let creep of Object.values(Game.creeps)) {
        const room = creep.room;
        if (!Memory.roads[room.name]) {
            Memory.roads[room.name] = new Array(50).fill(new Array(50).fill(0));
        }
        if (creep.fatigue) {
            Memory.roads[room.name][creep.pos.y][creep.pos.x]++;
        }
    }
}

function createBuildRoadTasks(room) {
    let num_roads = room.find(FIND_STRUCTURES, {
        filter: (structure) => structure.structureType == STRUCTURE_ROAD
    }).length;
    if (num_roads >= max_road_number(room)) {
        info("Not building any roads because we already have " + num_roads);
        return;
    }

    let positions = [];

    for (let row = 0; row < 50; row++) {
        for (let col = 0; col < 50; col++) {
            //if (Memory.roads[room.name][row][col] >= constants.AUTOMATIC_ROAD_BUILD_TICKS * road_build_ratio(room))
            if (Memory.roads[room.name][row][col])
                positions.push({ x: col, y: row, val: Memory.roads[room.name][row][col] });
            /*} else if (Memory.roads[room.name][row][col]) {
                let ratio = road_build_ratio(room);
                console.log("Not building road.");
                console.log("Road build frequency: " + constants.ROAD_BUILD_TICKS);
                console.log("Road build ratio: " + road_build_ratio(room));
                console.log("Value: " + Memory.roads[room.name][row][col]);
            }*/
            Memory.roads[room.name][row][col] = 0;
        }
    }

    positions.sort((a, b) => b.val - a.val);

    for (let i = 0; i < Math.min(AUTOMATIC_ROAD_BUILD_NUM, positions.length); i++) {
        let pos = new RoomPosition(positions[i].x, positions[i].y, room.name);
        pos.createConstructionSite(STRUCTURE_ROAD);
        info("Spawning road construction site at ", pos);
    }
}

// TOWER BUILDING

function monitorTowerBuilding() {
    let rooms = Game.getOurRooms();

    for (let room of rooms) {
        if (canBuildTower(room)) {
            let pos = findTowerPos(room);
            if (pos) {
                pos.createConstructionSite(STRUCTURE_TOWER);
            }
        }
    }
}

function canBuildTower(room) {
    let maxTowers = CONTROLLER_STRUCTURES.tower[room.controller.level];
    let curTowers = room.find(FIND_STRUCTURES, {filter: { structureType : STRUCTURE_TOWER}}).length;
    if (curTowers < maxTowers) return true;
    return false;
}

/**
 * 
 * @param {Room} room 
 */
function findTowerPos(room) {
    let structures = room.find(FIND_STRUCTURES).concat(room.find(FIND_CONSTRUCTION_SITES));
    let central_point = findCentralPoint(structures.map((structure) => structure.pos));
    let central_position = new RoomPosition(central_point.x, central_point.y, room.name);
    let build_pos = findClosestValidPosition(central_position, (position) => {
        return position.isGenerallyWalkable() && position.getAdjacentWalkables().length > 5 && hasDistance(position, 3);
    });
    return build_pos;
}

export { monitor };