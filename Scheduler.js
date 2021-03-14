import { info, warning, error, profileCpu } from "./Logging";
import { INFINITY, PARALLEL_CONTAINER_BUILD_NUM, PRIORITY_LEVEL_STEP, Role } from "./Constants";

import { QueueTask, CreepTask  } from "./Task/Task";
import { task as task_build} from "./Task/Build";
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

const permanent_tasks = [task_fill_store, task_claim_room];

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
        //creep.say(Math.floor(creep.task.estimated_time) + " " + creep.memory.ticks);
        ++creep.memory.ticks;
        let still_running = task_mapping[creep.task.name].run(creep);
        if (!still_running) {
            completeTask(creep);
        }
    }
}


function schedule() {
    let workers = [];
    let task_queue_sorted = [];
    // profileCpu("pre work", () => {
    monitorPermanentTasks();
    for (let creep of Game.findCreeps()) {
        if (creep.tasks.length == 0) {
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
    
    for (let task_type in Memory.new_tasks) {
        let task_queue = Memory.new_tasks[task_type];
        for (let task of task_queue) {
            task_queue_sorted.push(task);
        }
    }
    task_queue_sorted.sort((a, b) => b.priority - a.priority);
    // });

    let matches = [];
    let best_task = undefined;
    let best_creep = undefined;
    let best_rating = 0;
    let match = 0;
    // profileCpu("find matching", () => {
    workers = workers.filter(creep => {
        let future_creep = creep.future_self || creep;
        if (future_creep && future_creep.time && future_creep.time >= (Game.time + 50)) return false;
        return true;
    });
    let cpu = Game.cpu.getUsed();
    // error(Game.cpu.getUsed());
    for(let queue_task of task_queue_sorted) {
        let target = Game.getObjectById(queue_task.id);
        if (!target) continue;
        // error("start", Game.cpu.getUsed());
        // let asdf;
        // for (let worker of workers) {
        //     asdf += worker.pos.estimatePathCosts(target.pos, 1, worker);
        // }
        // error("after error",Game.cpu.getUsed());
        for (let worker of workers) {
            worker.dist = worker.pos.estimatePathCosts(target.pos, 1, worker);
        }
        // error("after dist",Game.cpu.getUsed());
        workers.sort((a, b) => a.dist - b.dist);
        // error("after sort",Game.cpu.getUsed());
        for (let creep of workers) {
            // profileCpu(creep.name + " " + queue_task.name, () => {
            let future_creep = creep.future_self || creep;
            if (creep.tasks.length > 0 && queue_task.priority < 1 * PRIORITY_LEVEL_STEP) return; //continue;

            let creep_value;
            // error(Game.cpu.getUsed());
            creep_value = task_mapping[queue_task.name].eval_func(future_creep, queue_task, best_rating / (queue_task.priority || 1));
            // error(Game.cpu.getUsed());
            if (creep_value * queue_task.priority > best_rating) {
                best_creep = creep;
                best_rating = creep_value * (queue_task.priority || 1);
                best_task = queue_task;
            }
            matches.push({
                creep_name: creep.name,
                rating: creep_value * (queue_task.priority || 1),
                task: queue_task
            });
            // }, (x) => x > 20);
            match++;
            if(Game.cpu.getUsed() - cpu > 50) {
                break;
            }
        }
        if(Game.cpu.getUsed() - cpu > 50) {
            break;
        }
    }
    // });
    error("Total matches: ", match);
    // // profileCpu("take task", () => {
    // if (best_creep != undefined) {
    //     assignTask(best_creep, best_task);
    // } else {
    //     error("best creep undefined");
    // }

    matches.sort((a,b) => b.rating - a.rating);
    error(matches);
    let assigned = 0;
    for (let i = 0; i < matches.length; ++i) {
        let creep = Game.creeps[matches[i].creep_name];
        if (creep.assigned || matches[i].task.assigned){
            continue;
        } else {
            assignTask(creep, matches[i].task);
            creep.assigned = true;
            matches[i].task.assigned = true;
            ++assigned;    
        }
        if (assigned == 5) {
            break;
        }
    }
    matches.map((match) => {
        match.task.assigned = undefined;
        Game.creeps[match.creep_name].assigned = undefined;
    });

    // });
    if(Game.cpu.getUsed() > Game.cpu.tickLimit / 2) {
        // Don't spawn if we're out of CPU.
        return;
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
        let result = target.pos.findClosestTarget(spawns, 1, Game.getCostMatrix()); 
        if (!result) continue;
        let spawn = result.target;
        if (!spawn || !spawn.allowSpawn()) continue;
        info("spawning for: " , queue_task.name, " - ", queue_task.priority , "   ", queue_task.id, " ", Game.getObjectById(queue_task.id).pos);
        spawns.splice(spawns.indexOf(spawn), 1);

        var num_creeps = Game.numCreeps();
        var num_rooms = Game.getOurRooms().length;
        var num_creeps_per_room = Math.floor(num_creeps / num_rooms);
        // if (num_creeps_per_room < 2) {
        //     spawn.spawnKevin();
        //     continue;
        // }
        task_mapping[queue_task.name].spawn(queue_task, spawn);
    }
}

function assignTask(creep, queue_task) {
    let creep_task = task_mapping[queue_task.name].take(creep, queue_task);
        if (creep_task) {
            let future_creep = creep.future_self || creep;
            let creep_after = task_mapping[queue_task.name].creepAfter(future_creep, creep_task);
            creep_task.creep_after = {
                pos: {
                    x : creep_after.pos.x,
                    y : creep_after.pos.y,
                    roomName: creep_after.pos.roomName},
                store: creep_after.store};
            creep_task.estimated_time = task_mapping[queue_task.name].estimateTime(future_creep, queue_task);
    
            creep.tasks.push(creep_task);
            error("Assigning ", creep.name, creep_task.name);
        }
}

function monitorPermanentTasks() {
    for (let permanent_task of permanent_tasks) {
        let creeps = Game.findCreeps(creep => creep.memory.role === permanent_task.role);
        for (let creep of creeps) {
            if (creep.tasks.length == 0) {
                creep.tasks.push({name: permanent_task.name});
            }
        }
        permanent_task.checkSpawn();
    }
}

/**
 * 
 * @param {Creep} creep 
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

export { 
    updateTaskQueue, 
    increasePriorities,
    runTask,
    completeTask,
    schedule,
};