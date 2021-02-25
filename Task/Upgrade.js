import { QueueTask, CreepTask, Task, State, takeFromStore, findQueueTask } from "./Task";
import "../GameObjects/Game";
import {error} from "../Logging";
import { INFINITY, UPGRADE_HIGH_PRIORITY, UPGRADE_LOW_PRIORITY, Role } from "../Constants";
import { Frankencreep } from "../FrankenCreep";

const task = Object.create(new Task("upgrade"));
task.state_array = [
    new State(takeFromStore),
    new State(upgradeController),
];

/**
 * 
 * @param {Creep} creep 
 */
function upgradeController(creep){
    let controller = Game.getObjectById(creep.task.id);

    if (!controller) return false;

    creep.upgrade(controller);
    
    if (creep.store[RESOURCE_ENERGY] == 0){
        return false;
    }
    
    return true;
}

/**
 * @this {{name: string}} 
 */
task.updateQueue = function() {
    let controller = [];
    let rooms = Game.getOurRooms();
    
    rooms.forEach(room => {
        controller.push(room.controller);
    });
    
    Memory.new_tasks[this.name] = Memory.new_tasks[this.name] || [];
    for (let structure of controller) {
        if (!Memory.new_tasks[this.name].find(controller_task => controller_task.id == structure.id)) {
            let queue_task = {id: structure.id, priority: UPGRADE_HIGH_PRIORITY, name: this.name};
            prioritize(queue_task);
            Memory.new_tasks[this.name].push(queue_task);
        }
    }
    
    // TODO when to delete?
    for (let i = 0; i < Memory.new_tasks[this.name].length; i++) {
        let upgrade_task = Memory.new_tasks[this.name][i];
        controller = Game.getObjectById(upgrade_task.id);
        if (!controller || !controller.my) {
            Memory.new_tasks[this.name].splice(i, 1);
            i--;
        }
    }
}

function prioritize(queue_task) {
    queue_task.priority = UPGRADE_HIGH_PRIORITY;
}

/**
 * 
 * @param {Creep} creep 
 * @param {{name: string, id: string, creep_exp_fillup: number}} creep_task 
 */
task.finish = (creep, creep_task) => {
    let queue_task = findQueueTask(creep_task.name, creep_task.id);
    if (queue_task)
        prioritize(queue_task);
}

/**
 * @param {Creep} creep
 * @param {QueueTask} queue_task 
 * @return {CreepTask}
 */
task.take = function(creep, queue_task) {
    let creep_task = {};
    
    creep_task.id = queue_task.id;
    creep_task.name = queue_task.name;

    queue_task.priority = UPGRADE_LOW_PRIORITY;

    return creep_task;
}

/**
 * Estimates the time for creep to finish queue_task.
 * @param {Creep} creep 
 * @param {QueueTask} queue_task 
 * @param {number=} max_time
 * @return {number}
 */
task.estimateTime = function(creep, queue_task, max_time) {
    let structure = /**@type {StructureController}*/ (Game.getObjectById(queue_task.id));
    if (!structure) return INFINITY;
    if (creep.getActiveBodyparts(WORK) == 0) return INFINITY;


    let energy = creep.store[RESOURCE_ENERGY] || creep.store.getCapacity(RESOURCE_ENERGY);
    let upgrade_time = energy/creep.getActiveBodyparts(WORK);

    if (!creep.store[RESOURCE_ENERGY]) {
        let energy_struct = creep.findOptimalEnergy(structure.pos, max_time - upgrade_time);
        if (!energy_struct || !energy_struct.object) return INFINITY;

        let harvest_time = 0;
        if (energy_struct.type == FIND_SOURCES) {
            if (creep.getActiveBodyparts(WORK) == 0) return INFINITY;
            let capacity = creep.store.getFreeCapacity(RESOURCE_ENERGY);
            harvest_time = capacity / (2 * creep.getActiveBodyparts(WORK));
        }

        let energy_path_time = creep.pos.estimatePathCosts(energy_struct.object.pos, 1, creep, max_time - harvest_time - upgrade_time);
        if (energy_path_time >= INFINITY) return INFINITY;
        let work_path_time = energy_struct.object.pos.estimatePathCosts(structure.pos, 3, creep, max_time - harvest_time - energy_path_time - upgrade_time);
        if (work_path_time >= INFINITY) return INFINITY; 
        
        return work_path_time + energy_path_time + harvest_time + upgrade_time;
    }
    
    let path_costs = creep.pos.estimatePathCosts(structure.pos, 3, creep, max_time - upgrade_time);
    if (path_costs >= INFINITY) return INFINITY;
    return path_costs + upgrade_time;
}

/**
 * 
 * @param {Creep} creep 
 * @param {QueueTask} queue_task 
 * @param {number} min_value
 * @this {Task} 
 */
task.eval_func = function(creep, queue_task, min_value) {
    let energy = creep.store[RESOURCE_ENERGY] || creep.store.getCapacity(RESOURCE_ENERGY);

    let max_time = min_value ? energy/min_value : undefined;

    let time = this.estimateTime(creep, queue_task, max_time) + 1;
    if (time >= INFINITY) return 0;
    return energy/time;
}
/**
 * 
 * @param {QueueTask} queue_task 
 * @param {StructureSpawn} spawn
 * @return {number} 
 * @this {Task}
 */
task.spawn = function(queue_task, spawn) {
    let self = this;
    return spawn.spawnWithEvalFunc((creep) => self.eval_func(creep, queue_task, 0), "Ash" + Game.time, {role: Role.WORKER});
}

/**
 * @param {Creep} creep
 * @param {CreepTask} creep_task 
 * @return {Frankencreep}
 */
task.creepAfter = function(creep, creep_task) {
    let target = Game.getObjectById(creep_task.id);
    let freePositions = target.pos.getAdjacentGenerallyWalkables();
    if (freePositions.length == 0) {
        error(target, " is unreachable!");
        return null;
    }
    let frankencreep = new Frankencreep(freePositions[0], creep.body.map((part) => part.type), creep.name);
    return frankencreep;
}

export {task};
