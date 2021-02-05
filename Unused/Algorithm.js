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
    let todo = new heap.Heap((a, b) => a.path + a.estimate - (b.path + b.estimate));
    todo.insert({path: 0, pos: posA, type: 'visA', estimate: estimateRemainingPath(posA, posC, room, posA, 'visA')});
    todo.insert({path: 0, pos: posC, type: 'visC', estimate: estimateRemainingPath(posA, posC, room, posC, 'visC')});
    let k = 0;
    while (!todo.isEmpty()) {
        ++k;
        let current = todo.pop();
        //new RoomVisual(room.name).rect(current.pos.x, current.pos.y, 1, 1, {fill: (current.type === 'visA' ? '#0f0' : '#f00')});
        if (current.path + current.estimate >= best_path) {
            if (best_path >= 1e18) {
                log.warning("No path found!")
                return null;
            }
            return best_pos;
        }
        
        if (vis[current.pos.y][current.pos.x][current.type] < current.path) {
            continue;
        }
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
            let estimate = estimateRemainingPath(posA, posC, room, pos, current.type);
            if (path + estimate < best_path && path < vis[pos.y][pos.x][current.type]) {
                vis[pos.y][pos.x][current.type] = path;
                todo.insert({path: current.path + getCosts(pos, room), pos: pos, type: current.type,
                    estimate: estimate});
            }
        });
    }
    log.warning("No path found!");
    return null;
}

function estimateRemainingPath(posA, posC, room, currentPos, type) {
    if (type === 'visA') {
        let dx = Math.abs(currentPos.x - posC.x);
        let dy = Math.abs(currentPos.y - posC.y);
        return Math.max(dx, dy);
    } else {
        let dx = Math.abs(currentPos.x - posA.x);
        let dy = Math.abs(currentPos.y - posA.y);
        return Math.max(dx, dy);
    }
}

function getCosts(pos, room) {
    if (!walkable(pos, room)) {
        return 1e18;
    }
    pos = new RoomPosition(pos.x, pos.y, room.name);
    let costs = 2;
    // This is wrong, lookFor returns an array.
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
        if (structure.structureType !== STRUCTURE_ROAD 
            && structure.structureType !== STRUCTURE_RAMPART
            && structure.structureType !== STRUCTURE_CONTAINER) {
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