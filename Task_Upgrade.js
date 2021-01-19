import { QueueTask, CreepTask, Task, State, takeFromStore, upgradeController, getEnergyForTask } from "./Task";
import { getOurRooms } from "./Base";
import {error} from "./Logging";
import { PRIORITY_LEVEL_STEP } from "./Constants";

var task = new Task("upgrade", null);

task.updateQueue = () => {
    let controller = [];
    let rooms = getOurRooms();
    
    rooms.forEach(room => {
        controller.push(room.controller);
    });
    
    Memory.new_tasks.upgrade = Memory.new_tasks.upgrade || [];
    for (let structure of controller) {
        if (!Memory.new_tasks.upgrade.find(controller_task => controller_task.id == structure.id)) {
            let queue_task = {id: structure.id, priority: 2 * PRIORITY_LEVEL_STEP, name:"upgrade"};
            prioritize(queue_task);
            Memory.new_tasks.upgrade.push(queue_task);
        }
    }
    
    // TODO when to delete?
    for (let i = 0; i < Memory.new_tasks.upgrade.length; i++) {
        let upgrade_task = Memory.new_tasks.upgrade[i];
        controller = Game.getObjectById(upgrade_task.id);
        if (!controller || !controller.my) {
            Memory.new_tasks.upgrade.splice(i, 1);
            i--;
        }
    }
}

function prioritize(queue_task) {
    let controller = Game.getObjectById(queue_task.id);
    if (controller.level == 1) queue_task.priority = 2 * PRIORITY_LEVEL_STEP;
    else queue_task.priority = 2 * PRIORITY_LEVEL_STEP;
}

/**
 * @param {Creep} creep
 * @param {QueueTask} queue_task 
 * @return {CreepTask}
 */
task.take = function(creep, queue_task) {
    let creep_task = {};
    
    Object.assign(creep_task, getEnergyForTask(creep, queue_task).task);
    creep_task.id = queue_task.id;
    creep_task.name = queue_task.name;

    queue_task.priority = 0;
    
    return creep_task;
}

/**
 * Estimates the time for creep to finish queue_task.
 * @param {Creep} creep 
 * @param {QueueTask} queue_task 
 * @param {number=} max_cost
 * @return {number}
 */
task.estimateTime = function(creep, queue_task, max_cost) {
    let structure = Game.getObjectById(queue_task.id);
    if (!structure) return 0;

    let path_costs = creep.pos.getPathCosts(structure.pos, 3, max_cost);

    let energy = creep.store[RESOURCE_ENERGY] || creep.store.getCapacity(RESOURCE_ENERGY);
    let time_upgrade = energy/creep.getActiveBodyparts(WORK);

    return path_costs + time_upgrade;
}

task.state_array = [
    new State(takeFromStore),
    new State(upgradeController),
];


export {task};
