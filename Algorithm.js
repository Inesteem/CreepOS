/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Algorithm');
 * mod.thing == 'a thing'; // true
 */

// Finds the position posB fulfilling cond(posB) minimizing the path A -> B -> C.
function findInBetween(posA, posC, room, cond) {
    let vis = new Array(50).fill(new Array(50).fill({}));
    for (let i = 0; i < 50; i++) {
        for (let j = 0; j < 50; j++) {
            vis[i][j] = {'visA': -1, 'visC': -1};
        }
    }
    // TODO implement priority queue
    let todo = [{path: 0, pos: posA, type: 'visA'}, {path: 0, pos: posC, type: 'visC'}];
    while (todo.length) {
        let current = todo.shift();
        if (vis[current.pos.y][current.pos.x][current.type] != -1) {
            continue;
        }
        vis[current.pos.y][current.pos.x][current.type] = current.path;
        if (cond(current.pos)) {
            if ((current.type == 'visA' && vis[current.pos.y][current.pos.x]['visC'] >= 0) ||
               (current.type == 'visC' && vis[current.pos.y][current.pos.x]['visA'] >= 0)) {
                   return current.pos;
            }
        }
        
        let next_pos = getNextPositions(current, room, vis);
        next_pos.forEach(pos => {
            todo.push({path: current.path + getCosts(pos, room), pos: pos, type: current.type});
        });
    }
    console.log("no path found!");
    return null;
}

// Only call this on walkable positions.
function getCosts(pos, room) {
    pos = new RoomPosition(pos.x, pos.y, room.name);
    let costs = 2;
    let terrain = pos.lookFor(LOOK_TERRAIN);
    if (terrain == 'plain') {
        let structures = pos.lookFor(LOOK_STRUCTURES);
        structures.forEach(structure => {
            if (structure.type == "road") {
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
        if (structure.type != "road" && structure.type != "rampart") {
            result = false;
            return;
        }
    });
    return result;
}

function getNextPositions(current, room, vis) {
    let dirs = [{y: 0, x: 1}, {y: 1, x: 0}, {y: -1, x: 0}, {y: 0, x: -1},
               {y: 1, x: 1}, {y: 1, x: -1}, {y: -1, x: 1}, {y: -1, x: -1}];
    let new_pos = [];
    dirs.forEach(dir => {
       let new_dir =  {y: dir.y + current.pos.y, x: dir.x + current.pos.x};
       if (new_dir.x < 0 || new_dir.y < 0 || new_dir.x >= 50 || new_dir.y >= 50) {
           return;
       }
       
       if (vis[new_dir.y][new_dir.x][current.type] != -1 || !walkable(new_dir, room)) {
            return;
        }
        
       new_pos.push(new_dir);
    });
    return new_pos;
}

module.exports = {
    findInBetween: findInBetween
};