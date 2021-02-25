import {  QueueTask, CreepTask, findQueueTask, State, takeFromStore, Task } from "./Task";
import { info, error } from "../Logging";
import { INFINITY, BUILD_PRIORITY, BUILD_DEFAULT_PRIORITY, PRIORITY_LEVEL_STEP, Role } from "../Constants";
import { Frankencreep } from "../FrankenCreep";
import "../GameObjects/Game";
import "../GameObjects/Spawn";

const task = Object.create(new Task("build"));
task.state_array = [
    new State(takeFromStore),
    new State(buildStructure),
];

function buildStructure(creep){
    let structure = Game.getObjectById(creep.task.id);
    
    if(!structure){
        return false;
    }
    
    creep.buildStructure(structure);
    
    if (creep.store[RESOURCE_ENERGY] == 0) {
        return false;
    }
    return true;
}

/**
 * @this {Task}
 */
task.updateQueue = function() {
    let structures = [];
    let rooms = Game.getOurRooms();

    rooms.forEach(room => {
        structures = structures.concat(room.find(FIND_MY_CONSTRUCTION_SITES));
    });
    structures.sort((a, b) => b.progress - a.progress);

    // Update the new task map.
    Memory.new_tasks[this.name] = Memory.new_tasks[this.name] || [];
    for (let structure of structures) {
        if (!findQueueTask(this.name, structure.id)) {
            let queue_task = {
                id: structure.id,
                name: this.name,
                priority: 0
            };
            prioritize(queue_task);
            Memory.new_tasks[this.name].push(queue_task);
        }
    }
    for (let i = 0; i < Memory.new_tasks[this.name].length; i++) {
        let queue_task = Memory.new_tasks[this.name][i];
        let structure = Game.getObjectById(queue_task.id);
        if (!structure) {
            info("Finished building task", queue_task);
            Memory.new_tasks[this.name].splice(i, 1);
            i--;
        }
    }
}



/**
 * @param {QueueTask} queue_task 
 */
function prioritize(queue_task) {
    let structure = Game.getObjectById(queue_task.id);
    queue_task.priority = BUILD_PRIORITY[structure.structureType];
    if (!queue_task.priority) {
        queue_task.priority = BUILD_DEFAULT_PRIORITY;
    }
}

/**
 * @param {Creep} creep
 * @param {QueueTask} queue_task 
 * @return {?CreepTask}
 */
task.take = (creep, queue_task) => {
    let structure = Game.getObjectById(queue_task.id);
    
    if (!structure) return null;
    
    let add_energy = creep.store[RESOURCE_ENERGY] || creep.store.getCapacity(RESOURCE_ENERGY);
    
    queue_task.expected_progress = (queue_task.expected_progress || 0) + add_energy;
    
    reprioritize(queue_task);
    
    let creep_task = {};
    creep_task.creep_exp_progress = add_energy;
    
    creep_task.id = queue_task.id;
    creep_task.name = queue_task.name;
    return creep_task;
}

function reprioritize(queue_task) {
    let structure = Game.getObjectById(queue_task.id);
    if (!structure) {
        queue_task.priority = 0;
        return;
    }
    
    let expected_progress_total = structure.progress + (queue_task.expected_progress || 0);
    
    let completion = expected_progress_total / structure.progressTotal;

    if (completion >= 1) {
        queue_task.priority = 0;
    } else {
        prioritize(queue_task);
        queue_task.priority += completion * PRIORITY_LEVEL_STEP;
    }
}

/**
 * Estimates the time for creep to finish queue_task.
 * @param {Creep} creep 
 * @param {QueueTask} queue_task 
 * @param {number=} max_time
 * @return {number}
 */
task.estimateTime = function(creep, queue_task, max_time) {
    let structure = /**@type {ConstructionSite}  */ (Game.getObjectById(queue_task.id));
    if (!structure) return INFINITY;
    if (creep.getActiveBodyparts(WORK) == 0) return INFINITY;
    let to_build = structure.progressTotal - structure.progress;
    let energy = Math.min(to_build, creep.store[RESOURCE_ENERGY] || creep.store.getCapacity(RESOURCE_ENERGY));
    let build_time = energy/(5 * creep.getActiveBodyparts(WORK));

    if (!creep.store[RESOURCE_ENERGY]) {
        let energy_struct = creep.findOptimalEnergy(structure.pos, max_time - build_time);
        if (!energy_struct || !energy_struct.object) return INFINITY;

        let harvest_time = 0;
        if (energy_struct.type == FIND_SOURCES) {
            let capacity = creep.store.getFreeCapacity(RESOURCE_ENERGY);
            harvest_time = capacity / (2 * creep.getActiveBodyparts(WORK));
        }

        let energy_path_time = creep.pos.estimatePathCosts(energy_struct.object.pos, 1, creep, max_time - harvest_time - build_time);
        if (energy_path_time >= INFINITY) return INFINITY;
        let work_path_time = energy_struct.object.pos.estimatePathCosts(structure.pos, 3, creep, max_time - harvest_time - energy_path_time - build_time);
        if (work_path_time >= INFINITY) return INFINITY; 
        return work_path_time + energy_path_time + harvest_time + build_time;
    }


    let path_costs = creep.pos.estimatePathCosts(structure.pos, 3, creep, max_time - build_time);
    return path_costs + build_time;
}

/**
 * 
 * @param {Creep} creep 
 * @param {QueueTask} queue_task 
 * @param {number} min_value
 * @this {Task} 
 */
task.eval_func = function(creep, queue_task, min_value) {
    let structure = Game.getObjectById(queue_task.id);
    let energy = creep.store[RESOURCE_ENERGY] || creep.store.getCapacity(RESOURCE_ENERGY);
    let build = structure.progressTotal - structure.progress;
    let build_energy = Math.min(build, energy);

    let max_time = min_value ? build_energy/min_value : undefined;

    let time = this.estimateTime(creep, queue_task, max_time) + 1;
    if (time >= INFINITY) return 0;
    return build_energy/time;
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
    return spawn.spawnWithEvalFunc((creep) => self.eval_func(creep, queue_task, 0), "McGregor" + Game.time, {role: Role.WORKER});
}


task.finish = (creep, creep_task) => {
    let queue_task = findQueueTask(creep_task.name, creep_task.id);
    if (!queue_task) return;
    
    queue_task.expected_progress -= creep_task.creep_exp_progress;
    reprioritize(queue_task);
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
        error (target, " is unreachable!");
        return null;
    }
    let frankencreep = new Frankencreep(freePositions[0], creep.body.map((part) => part.type), creep.name);
    let energy_start = creep.store[RESOURCE_ENERGY] || creep.store.getFreeCapacity(RESOURCE_ENERGY);
    let use = Math.min(target.progressTotal - target.progress, 
                       creep.store[RESOURCE_ENERGY] || creep.store.getCapacity(RESOURCE_ENERGY));
    frankencreep.store[RESOURCE_ENERGY] = energy_start - use;
    return frankencreep;
}

export {task};