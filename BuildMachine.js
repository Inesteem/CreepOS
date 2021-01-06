import { numCreeps, getTowers } from "./Base";
import { AUTOMATIC_ROAD_BUILD_TICKS, AUTOMATIC_ROAD_BUILD_NUM } from "./Constants";
import { info } from "./Logging";

// CONTAINER BUILDING

function monitorBuildContainerTasks() {
    
}

function findSourceForNewContainer() {
    
}

function findPositionForContainer(source) {
    
}

// ROAD BUILDING

function max_road_number(room) {
    return 0.8 * room.controller.level * room.controller.level *
        numCreeps((creep) => true) *
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
        createBuildRoadTasks(Game.spawns['Spawn1'].room);
        Memory.road_build_counter = 0;
    }
}
 
function snapshot() {
    if (!Memory.roads) {
        Memory.roads = new Map();
    }
    for (let creep of Game.creeps.values()) {
        const room = creep.room;
        if (!Memory.roads[room.name]) {
            Memory.roads[room.name] = new Array(50).fill(new Array(50).fill(0));
        }
        //TODO don't count roads.
        let objects = room.lookForAt(LOOK_STRUCTURES, creep.pos);
        if (objects.length) continue;
        objects = room.lookForAt(LOOK_CONSTRUCTION_SITES, creep.pos);
        if (objects.length) continue;
        if (creep.fatigue) {
            Memory.roads[room.name][creep.pos.y][creep.pos.x]++;
        }
    }
}

function createBuildRoadTasks(room) {
    let num_roads = room.find(FIND_STRUCTURES, {
            filter: (structure) => structure.structureType == STRUCTURE_ROAD
    }).length;
    if (num_roads >= max_road_number(room)){
        info("Not building any roads because we already have " + num_roads);
        return;
    }

    let positions = [];
    
    for (let row = 0; row < 50; row++) {
        for (let col = 0; col < 50; col++) {
            //if (Memory.roads[room.name][row][col] >= constants.AUTOMATIC_ROAD_BUILD_TICKS * road_build_ratio(room))
            if (Memory.roads[room.name][row][col])
                positions.push({x: col, y: row, val: Memory.roads[room.name][row][col]});
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

export { monitorBuildRoadTasks };