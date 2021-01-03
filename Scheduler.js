var log = require("Logging");
var base = require("Base");
var algorithm = require("Algorithm");
var constants = require("Constants");
var defense = require("Defense");

function assignTask(creep) {
    if (creep.memory.role == constants.Role.MINER) {
        creep.memory.task = {name: 'fill_store'};
    } else if (creep.memory.role == constants.Role.SCOUT) {
        creep.memory.task = {name: 'claim_room'};
    } else if (creep.memory.role == constants.Role.ARCHER) {
        // TODO this does not belong here
        if (!defense.kite(creep)) {
            creep.moveTo(Game.flags["Flag1"].pos);
        }
    } else {
        creep.memory.task = getNextTask(creep);
    }
    creep.memory.ticks = 0;
}

function increasePriorities() {
    Memory.tasks.forEach((task) => {
        task.priority++;
    });
    
    for (let task_list_name in Memory.new_tasks) {
        let task_list = Memory.new_tasks[task_list_name];
        for (let task of task_list) {
            if (task.hasOwnProperty('priority')) {
                task.priority++;
            }
        }
    }
}

function getHasEnergyFunction(room) {
    let stores = base.getStoresWithEnergy(room);
    if (stores.length) {
        return {func: function(pos) {
            let structures = room.lookForAtArea(LOOK_STRUCTURES,Math.max(0, pos.y -1), Math.max(0, pos.x -1), Math.min(49, pos.y + 1), Math.min(49, pos.x +1), true);
            let result = false;
            for (let structure of structures) {
                if (structure.structure.structureType == STRUCTURE_CONTAINER) {
                    result = result || structure.structure.store[RESOURCE_ENERGY] > 0;
                }
            }
            return result;
        }, type: 'store_id'};
    } else {
        return {func: function(pos) {
            let sources = room.lookForAtArea( LOOK_SOURCES, Math.max(0, pos.y -1), Math.max(0, pos.x -1), Math.min(49, pos.y + 1), Math.min(49, pos.x +1), true);
            for (let source of sources) {
                if (source.source.energy > 0) {
                    return true;
                }
            }
            return false;
        }, type: 'source_id'};
    }
}

// Finds the closest energy source for the task if one is needed at all.
// Returns null if no energy is required.
// Returns the energy target object in the form {source_id: id} or {target_id: id}
function getEnergyForTask(creep, task) {
    if (creep.store[RESOURCE_ENERGY]) return {};
    let target = null;
    switch (task.name) {
        case "repair":
        case "build":
        case "fill_structure":
            if (task.id) {
                target = Game.getObjectById(task.id);
            }
        case "upgrade":
            if (task.id) {
                target = Game.getObjectById(task.id);
            }
    }
    
    if (!target) return {};
    
    let energy_function = getHasEnergyFunction(creep.room);
    let cond = energy_function.func;
    let type = energy_function.type;
    
    //log.info(creep.pos, target.pos, creep.room, cond);
    let energy_coords = algorithm.findInBetween(creep.pos, target.pos, creep.room, cond);
    log.error(energy_coords);
    if (!energy_coords) return {};
    
    let energy_position = new RoomPosition(energy_coords.x, energy_coords.y, creep.room.name);
    
    let energy_container = energy_position.getAdjacentContainer((container) => container.store[RESOURCE_ENERGY] > 0);
    
    let result = {};
    if (energy_container) {
        result = {task: {store_id: energy_container.id}, object: energy_container};
    } else {
        let source = energy_position.getAdjacentSource((source) => source.energy > 0);
        if (source) {
            result = {task: {source_id: source.id}, object: source};
        }
    }
    return result;
}

function getPath(creep, task){
    let first_target = null;
    let second_target = null;
    switch (task.name) {
        case "repair":
        case "build":
        case "fill_structure":
            if (task.id) {
                second_target = Game.getObjectById(task.structure_id);
            }
        case "upgrade":
            if (task.id) {
                second_target = Game.getObjectById(task.controller_id);
            }
    }
    if (!second_target) return 0;
    
    first_target = getEnergyForTask(creep, task).object;
    
    if (first_target)
        return creep.pos.findPathTo(first_target.pos).length +
            first_target.pos.findPathTo(second_target.pos).length;

    return creep.pos.findPathTo(second_target.pos).length;
}

function getNextTask(creep) {
    log.info("Finding task for creep ", creep);
    
    let max_priority = -1;
    let best_task = null;
    
    for (let task_type in Memory.new_tasks) {
        let task_queue = Memory.new_tasks[task_type];
        for (let task of task_queue) {
            let path_cost = getPath(creep, task) + 1;
            let current_priority = task.priority / path_cost;
            if (current_priority > max_priority) {
                max_priority = current_priority;
                best_task = task;
            }
        }
    }
    
    if (!best_task) return null;
    
    log.info("Taking task: ", best_task);
    best_task.priority = best_task.base_priority;
    
    let task = {};
    Object.assign(task, best_task);
    Object.assign(task, getEnergyForTask(creep, task).task);
    
    return task;
}

module.exports = {
    assignTask: assignTask,
    increasePriorities: increasePriorities,
    getHasEnergyFunction: getHasEnergyFunction,
    getEnergyForTask: getEnergyForTask,
    getPath: getPath,
    getNextTask: getNextTask
};