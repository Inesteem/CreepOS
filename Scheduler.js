import { info, warning, error } from "./Logging";
import { INFINITY, PARALLEL_CONTAINER_BUILD_NUM, PRIORITY_LEVEL_STEP, Role } from "./Constants";

import { QueueTask, CreepTask  } from "./Task/Task";
import { task, task as task_build} from "./Task/Build";
import { task as task_repair} from "./Task/Repair";
import { task as task_fill_structure} from "./Task/FillStructure";
import { task as task_claim_room} from "./Task/ClaimRoom";
import { task as task_upgrade} from "./Task/Upgrade";
import { task as task_fill_store} from "./Task/FillStore";
import { task as task_kite} from "./Task/Kite";
import { task as task_attack_source_keeper} from "./Task/Attack_SourceKeeper";
import { task as task_redistribute} from "./Task/Redistribute";

import "./GameObjects/Room";
import "./GameObjects/Game";
import { Frankencreep } from "./FrankenCreep";

const task_mapping = {};
task_mapping[task_upgrade.name] = task_upgrade;
task_mapping[task_build.name] = task_build;
task_mapping[task_fill_store.name] = task_fill_store;
task_mapping[task_repair.name] = task_repair;
task_mapping[task_claim_room.name] = task_claim_room;
task_mapping[task_fill_structure.name] = task_fill_structure;
task_mapping[task_kite.name] = task_kite;
task_mapping[task_attack_source_keeper.name] = task_attack_source_keeper;
task_mapping[task_redistribute.name] = task_redistribute;

function updateTaskQueue() {
    for (let task_name in task_mapping) {
        if (task_mapping.hasOwnProperty(task_name)) {
            if (task_mapping[task_name].updateQueue) {
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
    if (creep.task) {
        creep.say(Math.floor(creep.task.estimated_time) + " " + creep.memory.ticks);
        ++creep.memory.ticks;
        let still_running = task_mapping[creep.task.name].run(creep);
        if (!still_running) {
            completeTask(creep);
        }
    }
}


function schedule() {
    let workers = [];
    for (let creep of Game.findCreeps()) {
        if (!creep.tasks.length) {
            if (creep.memory.role === Role.SCOUT) {
                creep.tasks.push({name: task_claim_room.name});
            } else if (creep.memory.role === Role.ARCHER) {
                creep.tasks.push({name: task_kite.name});
            } else if (creep.memory.role === Role.SLAYER) {
                creep.tasks.push({name: task_attack_source_keeper.name});
            }
        } 
        if (creep.memory.role === Role.WORKER) {
            workers.push(creep);
        }
    }
    
    let task_queue_sorted = [];
    for (let task_type in Memory.new_tasks) {
        let task_queue = Memory.new_tasks[task_type];
        for (let task of task_queue) {
            task_queue_sorted.push(task);
        }
    }
    task_queue_sorted.sort((a, b) => b.priority - a.priority);

    // TODO
    let x = 0;
    for(let task of task_queue_sorted) {
        error (task);
        ++x;
        if (x >= 100) break; 

        let best_creep_name = "";
        let best_rating = {fit: 0, time: INFINITY};
        for (let creep of workers) {
            let future_creep = creep.future_self || creep;
          //  error("future_self", future_creep);
            if (future_creep && future_creep.time && future_creep.time >= Game.time + 200) continue;
            let creep_rating = getTaskFit(future_creep, task, best_rating.fit);
            if (creep_rating.fit > best_rating.fit) {
                best_creep_name = creep.name;
                best_rating = creep_rating;
            }
        }
        if (best_creep_name != "") {
            let creep = Game.creeps[best_creep_name];

            let creep_task = task_mapping[task.name].take(creep, task);
            if (!creep_task) continue;

            let creep_after = task_mapping[task.name].creepAfter(creep, creep_task);
            creep_task.creep_after = {
                pos: {
                    x : creep_after.pos.x,
                    y : creep_after.pos.y,
                    roomName: creep_after.pos.roomName},
                store: creep_after.store};
            creep_task.estimated_time = best_rating.time;

            creep.tasks.push(creep_task);
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

    let rooms = Game.getOurRooms((room) => room.hasExcessEnergy(500));
    let spawns = rooms.flatMap(room => room.findSpawns((spawn) => !spawn.spawning));
    let num_spawns = spawns.length;
    for (let i = 0; 
            (i < num_spawns)
            && (task_queue_sorted.length)
            && (task_queue_sorted[0].priority >= 1 * PRIORITY_LEVEL_STEP);
        ++i) {
        let queue_task = task_queue_sorted.shift();
        
        let target = Game.getObjectById(queue_task.id);
        if (!target) { continue; }
        let spawn = target.pos.findClosestTarget(spawns);
        if (!spawn || !spawn.allowSpawn()) continue;
        info("spawning for: " , queue_task.name, " - ", queue_task.priority , "   ", queue_task.id, " ", Game.getObjectById(queue_task.id).pos);
        spawns.splice(spawns.indexOf(spawn), 1);

        var num_creeps = Game.numCreeps();
        var num_rooms = Game.getOurRooms().length;
        var num_creeps_per_room = Math.floor(num_creeps / num_rooms);
        if (num_creeps_per_room < 2) {
            spawn.spawnKevin();
            continue;
        }
        let creep_name;
        creep_name = task_mapping[queue_task.name].spawn(queue_task, spawn);
        if (creep_name !== "") {
            // TODO improve this section.
            let creep = new Frankencreep(spawn.pos, [WORK, CARRY, MOVE], creep_name);
            creep.memory.spawning = true;
            let creep_task = task_mapping[queue_task.name].take(creep, queue_task);
            creep.tasks.push(creep_task);
        }
    }
}

/**
 * 
 * @param {{memory : Object}} creep 
 */
function completeTask(creep) {
    if (!creep.task) return;
    let creep_task = creep.tasks.shift();
    task_mapping[creep_task.name].finish(creep, creep_task);
    creep.memory.old_task = creep_task;
    creep.memory.ticks = 0;
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
 * @param {number} best_fit
 * @return {{fit: number, time: number}} 
 */
function getTaskFit(creep, queue_task, best_fit) {
    let floor_priority = Math.floor(queue_task.priority/PRIORITY_LEVEL_STEP) * PRIORITY_LEVEL_STEP;
    let max_time = best_fit ? floor_priority / best_fit : undefined;

    if (max_time && max_time < 2) return {fit: 0, time: INFINITY};
    let total_time = 0;
    if (creep.time) {
        total_time = creep.time;
    }
    let task_time = task_mapping[queue_task.name].estimateTime(creep, queue_task, max_time) + 1;
    total_time += task_time;
    if (task_time >= INFINITY) return {fit: 0, time: INFINITY};
    
    return {fit: floor_priority / total_time, time: task_time};
}

export { 
    updateTaskQueue, 
    increasePriorities,
    runTask,
    completeTask,
    schedule,
};