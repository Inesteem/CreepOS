import { info, warning, error } from "./Logging";
import { Role } from "./Constants";
import { kite } from "./Defense";

import { getEnergyForTask } from "./Task";
import { task as task_build} from "./Task_Build";
import { task as task_repair} from "./Task_Repair";
import { task as task_fill_structure} from "./Task_FillStructure";
import { task as task_claim_room} from "./Task_ClaimRoom";
import { task as task_upgrade} from "./Task_Upgrade";
import { task as task_fill_store} from "./Task_FillStore";
import { task as task_collect_dropped_energy} from "./Task_CollectDroppedEnergy";

import { QueueTask, CreepTask } from "./Task";
/**
 * TODO what is required of these Task modules
 * Mandatory:
 * - task - a task object containing a state array to run the task
 * 
 * Optional (will fallback to default or do nothing if not present):
 * - updateQueue -> called to fill new_tasks with queue_tasks
 * - take(creep, queue_task) -> called everytime a creep takes the task, returns
 *  the creep_task object to be stored in creep memory, returns null if the task is obsolete.
 * - finish(creep, creep_task) -> called when the creep finishes the task
 */
var task_mapping = {
        'upgrade':                task_upgrade,
        'build':                  task_build,
        'fill_store':             task_fill_store,
        'repair':                 task_repair,
        'claim_room':             task_claim_room,
        'fill_structure':         task_fill_structure,
        'collect_dropped_energy': task_collect_dropped_energy, 
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

/**
 * 
 * @param {Creep} creep 
 * @param {number} depth 
 */
function runTask(creep, depth) {
    if (creep.memory.task && creep.memory.task.name) {
        //creep.say(creep.memory.task.name);
        ++creep.memory.ticks;
        error(creep.memory.task);
        let still_running = task_mapping[creep.memory.task.name].run(creep);
        if (!still_running) {
            completeTask(creep);
        }
    }
    
    if (!creep.memory.task || !creep.memory.task.name) {
        assignTask(creep);
        if(depth > 0) runTask(creep, depth -1);
    }
}

/**
 * 
 * @param {Creep} creep 
 */
function assignTask(creep) {
    //creep.say("assignTask");
    if (creep.memory.role === Role.MINER) {
        creep.memory.task = {name: 'fill_store'};
    } else if (creep.memory.role === Role.SCOUT) {
        creep.memory.task = {name: 'claim_room'};
    } else if (creep.memory.role === Role.ARCHER) {
        // TODO this does not belong here
        if (!kite(creep) && !creep.pos.inRangeTo(Game.flags["Flag1"], 5)) {
            creep.moveTo(Game.flags["Flag1"].pos);
        }
    } else {
        let next_task = getNextTask(creep);
        creep.memory.task = next_task;
        
        
    }
    creep.memory.ticks = 0;
}

/**
 * 
 * @param {{memory : Object}} creep 
 */
function completeTask(creep) {
    //creep.say("completeTask");
    info(creep.id, " is completing task ", creep.memory.task.name);
    let creep_task = creep.memory.task;
    if (task_mapping[creep_task.name].finish && 
        task_mapping[creep_task.name].hasOwnProperty('finish')) {
        info(creep.id, " is calling finish for ", creep.memory.task.name);
        task_mapping[creep_task.name].finish(creep, creep_task);
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

/**
 * 
 * @param {Creep} creep 
 * @param {QueueTask} queue_task 
 */
function getPath(creep, queue_task){
    let first_target = null;
    let second_target = queue_task.id && Game.getObjectById(queue_task.id);
    if (!second_target) return 0;
    
    first_target = getEnergyForTask(creep, queue_task).object;
    
    if (first_target)
        return creep.pos.findPathTo(first_target.pos).length +
            first_target.pos.findPathTo(second_target.pos).length;

    return creep.pos.findPathTo(second_target.pos).length;
}

/**
 * Fetches the next task for creep from the task queue. Returns a creep_task.
 * @param {Creep} creep 
 */
function getNextTask(creep) {
    info("Finding task for creep ", creep.id);
    
    let max_priority = -1;
    let /** ?QueueTask */ possible_queue_task = null;
    
    for (let task_type in Memory.new_tasks) {
        let task_queue = Memory.new_tasks[task_type];
        for (let task of task_queue) {
            if(task_mapping[task.name].hasOwnProperty('isSuitable')){
                if(!task_mapping[task.name].isSuitable(creep, task)) continue;
            }
            let path_cost = getPath(creep, task) + 1;
            let current_priority = task.priority / path_cost;
            if (current_priority > max_priority) {
                max_priority = current_priority;
                possible_queue_task = task;
            }
        }
    }
    
    if (!possible_queue_task) return null;

    let /** QueueTask */ queue_task = possible_queue_task;
    
    info("Taking task: ", queue_task);
    
    if (typeof task_mapping[queue_task.name].take === 'function' &&
        task_mapping[queue_task.name].hasOwnProperty('take')) {
        let creep_task = task_mapping[queue_task.name].take(creep, queue_task);
        return creep_task;
    } else {
        warning("take function not implemented for ", queue_task.name);
        queue_task.priority = 0;
        let creep_task = {}
        Object.assign(creep_task, queue_task);
        Object.assign(creep_task, getEnergyForTask(creep, queue_task).task);
        return creep_task;
    }
}

export { 
    updateTaskQueue, 
    assignTask, 
    increasePriorities, 
    getPath, 
    getNextTask, 
    runTask,
    completeTask,
};