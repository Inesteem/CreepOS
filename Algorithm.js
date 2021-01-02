/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Algorithm');
 * mod.thing == 'a thing'; // true
 */
var heap = require("Heap");
var log = require("Logging");

// Finds the position posB fulfilling cond(posB) minimizing the path A -> B -> C.
function findInBetween(posA, posC, room, cond) {
    let best_path = 1e18;
    let best_pos = {};
    let vis = new Array(50);
    for (let i = 0; i < 50; i++) {
        vis[i] = new Array(50);
        for (let j = 0; j < 50; j++) {
            vis[i][j] = {'visA': 1e18, 'visC': 1e18};
        }
    }
    let todo = new heap.Heap((a, b) => a.path - b.path);
    todo.insert({path: 0, pos: posA, type: 'visA'});
    todo.insert({path: 0, pos: posC, type: 'visC'});
    while (!todo.isEmpty()) {
        let current = todo.pop();
        if (current.path >= best_path) {
            return best_pos;
        }
        
        if (vis[current.pos.y][current.pos.x][current.type] <= current.path) {
            continue;
        }
        if (current.path == 0) {
            log.info(current);
        }
        vis[current.pos.y][current.pos.x][current.type] = current.path;
        if (cond(current.pos)) {
            let new_result = vis[current.pos.y][current.pos.x]['visA'] +
                        vis[current.pos.y][current.pos.x]['visC'];
            if (best_path > new_result) {
                best_path = new_result;
                best_pos = current.pos;
            }
        }
        let next_pos = getNextPositions(current, room);
        next_pos.forEach(pos => {
            let path = current.path + getCosts(pos, room);
            if (path < vis[pos.y][pos.x][current.type]) {
                todo.insert({path: current.path + getCosts(pos, room), pos: pos, type: current.type});
            }
        });
    }
    console.log("no path found!");
    return null;
}

function getCosts(pos, room) {
    if (!walkable(pos, room)) {
        return 1e18;
    }
    pos = new RoomPosition(pos.x, pos.y, room.name);
    let costs = 2;
    let terrain = pos.lookFor(LOOK_TERRAIN);
    if (terrain == 'plain') {
        let structures = pos.lookFor(LOOK_STRUCTURES);
        structures.forEach(structure => {
            if (structure.structureType == "road") {
                costs = 1;
            }
        });
    } else if (terrain == 'swamp') {
        costs = 10;
    }
    return costs;
}

function walkable(pos, room){
    let room_position = new RoomPosition(pos.x, pos.y, room.name);
    let terrain = room_position.lookFor(LOOK_TERRAIN);
    if (terrain == 'wall') {
       return false;
    }
    
    let result = true;
    let structures = room_position.lookFor(LOOK_STRUCTURES);
    structures.forEach(structure => {
        if (structure.structureType !== "road" && structure.structureType !== "rampart") {
            result = false;
            return;
        }
    });
    return result;
}

function getNextPositions(current, room) {
    let dirs = [{y: 0, x: 1}, {y: 1, x: 0}, {y: -1, x: 0}, {y: 0, x: -1},
               {y: 1, x: 1}, {y: 1, x: -1}, {y: -1, x: 1}, {y: -1, x: -1}];
    let new_pos = [];
    dirs.forEach(dir => {
       let new_dir =  {y: dir.y + current.pos.y, x: dir.x + current.pos.x};
       if (new_dir.x < 0 || new_dir.y < 0 || new_dir.x >= 50 || new_dir.y >= 50) {
           return;
       }
       
       if (!walkable(new_dir, room)) {
            return;
        }
        
       new_pos.push(new_dir);
    });
    return new_pos;
}

module.exports = {
    findInBetween: findInBetween
};