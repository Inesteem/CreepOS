import { info, warning, error } from "./Logging";
import { Role } from "./Constants";

import { getEnergyForTask } from "./Task";
import { task as task_build} from "./Task_Build";
import { task as task_repair} from "./Task_Repair";
import { task as task_fill_structure} from "./Task_FillStructure";
import { task as task_claim_room} from "./Task_ClaimRoom";
import { task as task_upgrade} from "./Task_Upgrade";
import { task as task_fill_store} from "./Task_FillStore";
import { task as task_kite} from "./Task_Kite";
import { task as task_attack_source_keeper} from "./Task_Attack_SourceKeeper";

import { QueueTask, CreepTask } from "./Task";
import { getOurRooms } from "./Base";
import "./Room";
import { Frankencreep } from "./FrankenCreep";
/**
 * TODO what is required of these Task modules
 * Mandatory:
 * - task - a task object containing a state array to run the task
 * - spawnCreep(queue_task) - spawns a creep suitable for the task and returns the spawn time, returns -1 if no spawn is possible.
 * 
 * Optional (will fallback to default or do nothing if not present):
 * - updateQueue -> called to fill new_tasks with queue_tasks
 * - take(creep, queue_task) -> called everytime a creep takes the task, returns
 *  the creep_task object to be stored in creep memory, returns null if the task is obsolete.
 * - finish(creep, creep_task) -> called when the creep finishes the task
 * - estimateTime(creep, queue_task, max_cost) -> Estimate the time it takes for creep to finish queue_task
 */
var task_mapping = {
        'upgrade':                task_upgrade,
        'build':                  task_build,
        'fill_store':             task_fill_store,
        'repair':                 task_repair,
        'claim_room':             task_claim_room,
        'fill_structure':         task_fill_structure,
        'kite':                   task_kite, 
        'attack_source_keeper':   task_attack_source_keeper, 
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
        let still_running = task_mapping[creep.memory.task.name].run(creep);
        if (!still_running) {
            completeTask(creep);
        }
    }
    
    if (!creep.memory.task || !creep.memory.task.name) {
        Memory.ready_queue = Memory.ready_queue || [];
        Memory.ready_queue.push(creep.name);
    }
}


function schedule() {
    let task_queue_sorted = [];
    for (let task_type in Memory.new_tasks) {
        let task_queue = Memory.new_tasks[task_type];
        for (let task of task_queue) {
            task_queue_sorted.push(task);
        }
    }
    task_queue_sorted.sort((a, b) => b.priority - a.priority);

    for (let i = 0; i < Math.min(1, Memory.ready_queue.length); ++ i){
        let name = Memory.ready_queue[i];
        let creep = Game.creeps[name];
        if (creep) {
            assignTask(creep, task_queue_sorted);
            runTask(creep, 0);
        }
        Memory.ready_queue.splice(i, 1);
        --i;
    }

    //TODO get rid of this.
    task_queue_sorted = [];
    for (let task_type in Memory.new_tasks) {
        let task_queue = Memory.new_tasks[task_type];
        for (let task of task_queue) {
            task_queue_sorted.push(task);
        }
    }
    task_queue_sorted.sort((a, b) => b.priority - a.priority);

    let rooms = getOurRooms();
    for (let room of rooms) {
        if (room.hasExcessEnergy(500)) {
            if (task_queue_sorted.length) {
                let queue_task = task_queue_sorted[0];
                let creep_name;
                if (task_mapping[queue_task.name].hasOwnProperty('spawn')) {
                    creep_name = task_mapping[queue_task.name].spawn(queue_task, room);
                } else {
                    creep_name = room.spawnKevin();
                }
                if (creep_name != "") {
                    // TODO improve this section.
                    let creep = new Frankencreep(new RoomPosition(25, 25, room.name), [WORK, CARRY, MOVE], creep_name);
                    Memory.creeps[creep_name] = {};
                    creep.memory = Memory.creeps[creep_name];
                    creep.memory.spawning = true;
                    let creep_task = task_mapping[queue_task.name].take(creep, queue_task);
                    creep.memory.task = creep_task;
                    error(Memory.creeps[creep_name]);
                }
                task_queue_sorted.pop();
            }
        }
    }
}

/**
 * 
 * @param {Creep} creep 
 */
function assignTask(creep, task_queue_sorted) {
    // //creep.say("assignTask");
    // if (creep.memory.role === Role.MINER) {
    //     creep.memory.task = {name: 'fill_store'};
    if (creep.memory.role === Role.SCOUT) {
        creep.memory.task = {name: 'claim_room'};
    } else if (creep.memory.role === Role.ARCHER) {
        creep.memory.task = {name: 'kite'};
    } else if (creep.memory.role === Role.SLAYER) {
        creep.memory.task = {name: 'attack_source_keeper'};
    } else {
        let next_task = getNextTask(creep, task_queue_sorted);
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
 * @param {number=} maxPathCost The maximal path costs, returns -1 if path costs are more
 */
function getPath(creep, queue_task, maxPathCost){
    let first_target = null;
    let second_target = queue_task.id && Game.getObjectById(queue_task.id);
    if (!second_target) return 0;
    
    let result = getEnergyForTask(creep, queue_task, maxPathCost);
    if (!result.incomplete)
        first_target = result.object;
    else
        return Infinity;
    
    if (first_target)
        return creep.pos.findPathTo(first_target.pos).length +
            first_target.pos.findPathTo(second_target.pos).length;

    return creep.pos.findPathTo(second_target.pos).length;
}

/**
 * Fetches the next task for creep from the task queue. Returns a creep_task.
 * @param {Creep} creep 
 */
function getNextTask(creep, task_queue_sorted) {
    info("Finding task for creep ", creep.id);
    
    let max_priority = -1;
    let /** ?QueueTask */ possible_queue_task = null;
    
    let searched = false;
    for (let queue_task of task_queue_sorted) {
        //Cancel and take whichever task we have if we ran out of CPU
        if (searched && Game.cpu.getUsed() >= Game.cpu.limit) {
            break;
        }
        let path_cost = 0;
        let max_cost = searched ? queue_task.priority / max_priority : undefined;
        if (task_mapping[queue_task.name].hasOwnProperty('estimateTime')) {
            path_cost = task_mapping[queue_task.name].estimateTime(creep, queue_task, max_cost) + 1;
            //path_cost = 1;
        } else {
            path_cost = getPath(creep, queue_task, max_cost) + 1;
        }
        if (path_cost >= Infinity) continue;
        searched = true;
        let current_priority = queue_task.priority / path_cost;
        if (current_priority !== null && current_priority > max_priority) {
            max_priority = current_priority;
            possible_queue_task = queue_task;
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
    increasePriorities, 
    getPath, 
    getNextTask, 
    runTask,
    completeTask,
    schedule,
};