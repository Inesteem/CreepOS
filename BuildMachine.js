/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('BuildMachine');
 * mod.thing == 'a thing'; // true
 */
var task_machine = require("TaskMachine");
var base = require("Base");
 
const road_build_frequency = 1000;

function max_road_number(room) {
    return
        0.8 * 
        room.controller.level * room.controller.level * 
        base.numCreeps((creep) => true) *
        (base.getTowers(room, (tower) => true).length + 1);
}

function road_build_ratio(room) {
    let num_roads = room.find(FIND_STRUCTURES, {
            filter: (structure) => structure.structureType == STRUCTURE_ROAD
    }).length;
    let x = (num_roads/max_road_number(room));
    let y = 1 - x*x;
    return y; 
}

 
function monitorBuildRoadTasks() {
    if (!Memory.road_build_counter) {
        road_build_counter = 0;
    }
    if (Memory.road_build_counter%10 == 0)
        console.log(Memory.road_build_counter);
    Memory.road_build_counter++;
    snapshot();
    if (Memory.road_build_counter > road_build_frequency) {
        createBuildRoadTasks(Game.spawns['Spawn1'].room);
        Memory.road_build_counter = 0;
    }
}
 
function snapshot() {
    if (!Memory.roads) {
        Memory.roads = new Map();
    }
    _.forEach(Game.creeps, creep => {
        const room = creep.room;
        if (!Memory.roads[room.name]) {
            Memory.roads[room.name] = new Array(50).fill(new Array(50).fill(0));
        }
        //TODO don't count roads.
        let objects = room.lookForAt(LOOK_STRUCTURES, creep.pos);
        if (objects.length) return;
        objects = room.lookForAt(LOOK_CONSTRUCTION_SITES, creep.pos);
        if (objects.length) return;
        if (creep.fatigue) {
            Memory.roads[room.name][creep.pos.y][creep.pos.x]++;
        }
    });
}

function createBuildRoadTasks(room) {

    let positions = [];
    
    for (let row = 0; row < 50; row++) {
        for (let col = 0; col < 50; col++) {
            if (Memory.roads[room.name][row][col] >= road_build_frequency * road_build_ratio(room))
            //if (Memory.roads[room.name][row][col])
                positions.push({x: col, y: row, val: Memory.roads[room.name][row][col]});
                Memory.roads[room.name][row][col] = 0;
            /*} else if (Memory.roads[room.name][row][col]) {
                let ratio = road_build_ratio(room);
                console.log("Not building road.");
                console.log("Road build frequency: " + road_build_frequency);
                console.log("Road build ratio: " + road_build_ratio(room));
                console.log("Value: " + Memory.roads[room.name][row][col]);
            }*/
        }
    }
    
    positions.sort((a, b) => b.val - a.val);
    
    for (let i = 0; i < Math.min(1, positions.length); i++) {
        console.log(JSON.stringify(positions[i]));
        let pos = new RoomPosition(positions[i].x, positions[i].y, room.name);
        console.log(pos.createConstructionSite(STRUCTURE_ROAD));
        console.log(JSON.stringify(pos));
    }
}

module.exports = {
    monitorBuildRoadTasks: monitorBuildRoadTasks
};