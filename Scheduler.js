import { info, warning, error } from "./Logging";
import { PRIORITY_LEVEL_STEP, Role } from "./Constants";

import { getEnergyForTask,QueueTask, CreepTask  } from "./Task/Task";
import { task as task_build} from "./Task/Task_Build";
import { task as task_repair} from "./Task/Task_Repair";
import { task as task_fill_structure} from "./Task/Task_FillStructure";
import { task as task_claim_room} from "./Task/Task_ClaimRoom";
import { task as task_upgrade} from "./Task/Task_Upgrade";
import { task as task_fill_store} from "./Task/Task_FillStore";
import { task as task_kite} from "./Task/Task_Kite";
import { task as task_attack_source_keeper} from "./Task/Task_Attack_SourceKeeper";
import { task as task_redistribute} from "./Task/Redistribute";

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
        'redistribute':   task_redistribute, 
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
    //if (creep) completeTask(creep);
    if (creep.memory.task && creep.memory.task.name) {
        creep.say(creep.memory.task.estimated_time + " " + creep.memory.ticks);
        ++creep.memory.ticks;
        let still_running = task_mapping[creep.memory.task.name].run(creep);
        if (!still_running) {
            completeTask(creep);
        }
    }
    //if(creep.memory.task_queue) creep.say(creep.memory.task_queue.length);
    if (!creep.memory.task || !creep.memory.task.name) {
        if (creep.memory.task_queue && creep.memory.task_queue.length) {
            creep.memory.task = creep.memory.task_queue.shift();
            runTask(creep, depth-1);
        } else {
            Memory.ready_queue = Memory.ready_queue || [];
            if (!Memory.ready_queue.find((name) => name === creep.name))
                Memory.ready_queue.push(creep.name);
        }
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

    for (let i = 0; i < 5 && Memory.ready_queue.length > 0; ++i){
        let name = Memory.ready_queue.shift();
        let creep = Game.creeps[name];
        if (creep) {
            assignTask(creep, task_queue_sorted);
            runTask(creep, 0);
        }
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
    //error (task_queue_sorted);

    let rooms = getOurRooms();
    for (let room of rooms) {
        if (room.hasExcessEnergy(1000)) {
            if (task_queue_sorted.length) {
                let queue_task = task_queue_sorted[0];
                if (queue_task.priority < 1 * PRIORITY_LEVEL_STEP) break;
                //error("spawning for: " , queue_task.name, " - ", queue_task.priority , "   ", queue_task.id, " ", Game.getObjectById(queue_task.id).pos);
                let creep_name;
                if (task_mapping[queue_task.name].hasOwnProperty('spawn')) {
                    creep_name = task_mapping[queue_task.name].spawn(queue_task, room);
                } else {
                    creep_name = room.spawnKevin();
                }
                if (creep_name !== "") {
                    // TODO improve this section.
                    let creep = new Frankencreep(new RoomPosition(25, 25, room.name), [WORK, CARRY, MOVE], creep_name);
                    Memory.creeps[creep_name] = {};
                    creep.memory = Memory.creeps[creep_name];
                    creep.memory.spawning = true;
                    let creep_task = task_mapping[queue_task.name].take(creep, queue_task);
                    creep.memory.task = creep_task;
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
        if (creep.memory.task_queue && creep.memory.task_queue.length) {
            creep.memory.task = creep.memory.task_queue.shift();
        } else {
            creep.say("reschedule");
            creep.memory.task_queue = creep.memory.task_queue || [];
            let next_task = getNextTask(creep, task_queue_sorted);
            creep.memory.task = next_task;
            let remaining_time = 0;
            if (next_task) remaining_time = Math.min(next_task.estimated_time, 100);
            let franky = creep;
            while (next_task) {
                franky = task_mapping[next_task.name].creepAfter(franky, next_task);
                if (!franky) break;
                next_task = getNextTask(franky, task_queue_sorted, remaining_time / creep.memory.task_queue.length);
                if (next_task) {
                    creep.memory.task_queue.push(next_task);
                }
            }
        }
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
 * @param {!Array<QueueTask>} task_queue_sorted
 * @param {number=} max_time The maximal time for the task to find.
 * @return {CreepTask|null} A creep task if one was found.
 */
function getNextTask(creep, task_queue_sorted, max_time) {
    let max_priority = -1;
    let /** ?QueueTask */ possible_queue_task = null;
    let time_possible_task = undefined;
    
    let searched = false;
    for (let queue_task of task_queue_sorted) {
        //Cancel and take whichever task we have if we ran out of CPU
        if (searched && Game.cpu.getUsed() >= Game.cpu.limit) {
            break;
        }
        let path_cost = 0;
        let floor_priority = Math.floor(queue_task.priority/PRIORITY_LEVEL_STEP) * PRIORITY_LEVEL_STEP;
        let max_cost = searched ? floor_priority / max_priority : max_time;
        if (max_cost < 2) break;
        if (task_mapping[queue_task.name].hasOwnProperty('estimateTime')) {
            let cpu_start = Game.cpu.getUsed();
            path_cost = task_mapping[queue_task.name].estimateTime(creep, queue_task, max_cost) + 1;
            let cpu_now = Game.cpu.getUsed();
            if (cpu_now - cpu_start > 1) error("Estimate time for ", queue_task, " too expensive, took ", cpu_now - cpu_start, " max cost ", max_cost);
            //path_cost = 1;
        } else {
            path_cost = getPath(creep, queue_task, max_cost) + 1;
        }
        if (path_cost >= Infinity) continue;
        searched = true;
        let current_priority = floor_priority / path_cost;
        if (current_priority !== null && current_priority > max_priority) {
            max_priority = current_priority;
            possible_queue_task = queue_task;
            time_possible_task = path_cost;
        }
    }
    
    if (!possible_queue_task) return null;

    let /** QueueTask */ queue_task = possible_queue_task;
    
    info("Taking task: ", queue_task);
    
    if (typeof task_mapping[queue_task.name].take === 'function' &&
        task_mapping[queue_task.name].hasOwnProperty('take')) {
        let creep_task = task_mapping[queue_task.name].take(creep, queue_task);
        creep_task.estimated_time = time_possible_task;
        return creep_task;
    } else {
        warning("take function not implemented for ", queue_task.name);
        queue_task.priority = 0;
        let creep_task = {};
        Object.assign(creep_task, queue_task);
        creep_task.id = queue_task.id;
        creep_task.name = queue_task.name;
        Object.assign(creep_task, getEnergyForTask(creep, queue_task).task);
        if (!creep_task.id || !creep_task.name) return null;
        creep_task.estimated_time = time_possible_task;
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