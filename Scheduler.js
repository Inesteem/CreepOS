var log = require("Logging");
var base = require("Base");
var algorithm = require("Algorithm");
var constants = require("Constants");
var defense = require("Defense");

var task = require("Task");
var task_build = require("Task.Build");
var task_repair = require("Task.Repair");
var task_fill_structure = require("Task.FillStructure");
var task_claim_room = require("Task.ClaimRoom");
var task_upgrade = require("Task.Upgrade");
var task_fill_store = require("Task.FillStore");

/**
 * TODO what is required of these Task modules
 * Mandatory:
 * - task - a task object containing a state array to run the task
 * 
 * Optional (will fallback to default or do nothing if not present):
 * - updateQueue -> called to fill new_tasks with queue_tasks
 * - take(creep, queue_task) -> called everytime a creep takes the task, returns
 *  the creep_task object to be stored in creep memory
 * - finish(creep, creep_task) -> called when the creep finishes the task
 */
var task_mapping = {
        'upgrade':                task_upgrade,
        'build':                  task_build,
        'fill_store':             task_fill_store,
        'repair':                 task_repair,
        'claim_room':             task_claim_room,
        'fill_structure':         task_fill_structure,
        //'collect_dropped_energy': task.collect_dropped_energy_task, 
};
    
function updateTaskQueue() {
    for (let task_name in task_mapping) {
        if (task_mapping.hasOwnProperty(task_name)) {
            if (task_mapping[task_name].updateQueue && 
                task_mapping[task_name].hasOwnProperty('updateQueue')) {
                task_mapping[task_name].updateQueue();
            }
        }
    }
}

function runTask(creep) {
    if (creep.memory.task) {
        ++creep.memory.ticks;
        let still_running = task_mapping[creep.memory.task.name].task.run(creep);
        if (!still_running) {
            completeTask(creep);
        }
    }
    
    if (!creep.memory.task) {
        assignTask(creep);
    }
}

function assignTask(creep) {
    if (creep.memory.role == constants.Role.MINER) {
        creep.memory.task = {name: 'fill_store'};
    } else if (creep.memory.role == constants.Role.SCOUT) {
        creep.memory.task = {name: 'claim_room'};
    } else if (creep.memory.role == constants.Role.ARCHER) {
        // TODO this does not belong here
        if (!defense.kite(creep) && !creep.pos.inRangeTo(Game.flags["Flag1"], 5)) {
            creep.(Game.flags["Flag1"].pos);
        }
    } else {
        creep.memory.task = getNextTask(creep);
    }
    creep.memory.ticks = 0;
}

function completeTask(creep) {
    let creep_task = creep.memory.task;
    if (task_mapping[creep_task.name].finish && 
        task_mapping[creep_task.name].hasOwnProperty(finish)) {
        task_mapping[creep_task.name].finish(creep_task);
    }
    creep.memory.old_task = creep.memory.task;
    creep.memory.task = null;
}

function increasePriorities() {
    for (let task_list_name in Memory.new_tasks) {
        let task_list = Memory.new_tasks[task_list_name];
        for (let task of task_list) {
            if (task.hasOwnProperty('priority')) {
                task.priority++;
            }
        }
    }
}

function getPath(creep, queue_task){
    let first_target = null;
    let second_target = queue_task.id && Game.getObjectById(queue_task.id);
    if (!second_target) return 0;
    
    first_target = task.getEnergyForTask(creep, queue_task).object;
    
    if (first_target)
        return creep.pos.findPathTo(first_target.pos).length +
            first_target.pos.findPathTo(second_target.pos).length;

    return creep.pos.findPathTo(second_target.pos).length;
}

// Fetches the next task for creep from the task queue. Returns a creep_task.
function getNextTask(creep) {
    log.info("Finding task for creep ", creep);
    
    let max_priority = -1;
    let queue_task = null;
    
    for (let task_type in Memory.new_tasks) {
        let task_queue = Memory.new_tasks[task_type];
        for (let task of task_queue) {
            let path_cost = getPath(creep, task) + 1;
            let current_priority = task.priority / path_cost;
            if (current_priority > max_priority) {
                max_priority = current_priority;
                queue_task = task;
            }
        }
    }
    
    if (!queue_task) return null;
    
    log.info("Taking task: ", queue_task);
    
    if (task_mapping[queue_task.name].take &&
        task_mapping[queue_task.name].hasOwnProperty(take)) {
        return task_mapping[queue_task.name].take(creep, queue_task);
    } else {
        log.warning("take function not implemented for ", queue_task.name);
        queue_task.priority = 0;
        let creep_task = {}
        Object.assign(creep_task, queue_task);
        Object.assign(creep_task, task.getEnergyForTask(creep, creep_task).task);
    
        return creep_task;
    }
}

module.exports = {
    updateTaskQueue: updateTaskQueue,
    assignTask: assignTask,
    increasePriorities: increasePriorities,
    getPath: getPath,
    getNextTask: getNextTask,
    runTask: runTask,
};