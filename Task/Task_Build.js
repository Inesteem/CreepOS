import {  QueueTask, CreepTask, findQueueTask, getEnergyForTask, State, takeFromStore, Task } from "./Task";
import { info, error } from "../Logging";
import { BUILD_ROAD_PRIORITY, BUILD_TOWER_PRIORITY, BUILD_EXTENSION_PRIORITY, BUILD_DEFAULT_PRIORITY, BUILD_SPAWN_PRIORITY, PRIORITY_LEVEL_STEP } from "../Constants";
import { Frankencreep } from "../FrankenCreep";
import "../Game";

/**
 * @constructor 
 */
function BuildTask(){
    this.state_array = [
        new State(takeFromStore),
        new State(buildStructure),
    ];
}

function buildStructure(creep){
    let structure = Game.getObjectById(creep.memory.task.id);
    
    if(!structure){
        return false;
    }
    
    creep.buildStructure(structure);
    
    if (creep.store[RESOURCE_ENERGY] == 0) {
        return false;
    }
    return true;
}

BuildTask.prototype = new Task("build", null);

var task = new BuildTask();

task.updateQueue = () => {
    let structures = [];
    let rooms = Game.getOurRooms();

    rooms.forEach(room => {
        structures = structures.concat(room.find(FIND_MY_CONSTRUCTION_SITES));
    });
    structures.sort((a, b) => b.progress - a.progress);

    // Update the new task map.
    Memory.new_tasks.build = Memory.new_tasks.build || [];
    for (let structure of structures) {
        if (!findQueueTask("build", structure.id)) {
            let queue_task = {
                id: structure.id,
                name: "build",
                priority: 0
            };
            prioritize(queue_task);
            Memory.new_tasks.build.push(queue_task);
        }
    }
    for (let i = 0; i < Memory.new_tasks.build.length; i++) {
        let queue_task = Memory.new_tasks.build[i];
        let structure = Game.getObjectById(queue_task.id);
        if (!structure) {
            info("Finished building task", queue_task);
            Memory.new_tasks.build.splice(i, 1);
            i--;
        }
    }
}

/**
 * @param {QueueTask} queue_task 
 */
function prioritize(queue_task) {
    let structure = Game.getObjectById(queue_task.id);
    
    switch (structure.structureType) {
        case (STRUCTURE_ROAD):
            queue_task.priority = BUILD_ROAD_PRIORITY;
            break;
        case (STRUCTURE_TOWER):
            queue_task.priority = BUILD_TOWER_PRIORITY;
            break;
        case (STRUCTURE_EXTENSION):
            queue_task.priority = BUILD_EXTENSION_PRIORITY;
            break;
        case (STRUCTURE_SPAWN):
            queue_task.priority = BUILD_SPAWN_PRIORITY;
            break;
        default:
            queue_task.priority = BUILD_DEFAULT_PRIORITY;
    };
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
    
    //Object.assign(creep_task, getEnergyForTask(creep, queue_task).task);
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
    if (!structure) return Infinity;
    if (creep.getActiveBodyparts(WORK) == 0) return Infinity;
    
    let to_build = structure.progressTotal - structure.progress;
    let energy = Math.min(to_build, creep.store[RESOURCE_ENERGY] || creep.store.getCapacity(RESOURCE_ENERGY));
    let build_time = energy/(5 * creep.getActiveBodyparts(WORK));

    if (!creep.store[RESOURCE_ENERGY]) {
        let energy_struct = creep.findOptimalEnergy(max_time - build_time);
        if (!energy_struct || !energy_struct.object) return Infinity;

        let harvest_time = 0;
        if (energy_struct.type == FIND_SOURCES) {
            if (creep.getActiveBodyparts(WORK) == 0) return Infinity;
            let capacity = creep.store.getFreeCapacity(RESOURCE_ENERGY);
            harvest_time = capacity / (2 * creep.getActiveBodyparts(WORK));
        }

        let energy_path_time = creep.pos.estimatePathCosts(energy_struct.object.pos, 1, creep, max_time - harvest_time - build_time);
        if (energy_path_time >= Infinity) return Infinity;
        let work_path_time = energy_struct.object.pos.estimatePathCosts(structure.pos, 3, creep, max_time - harvest_time - energy_path_time - build_time);
        if (work_path_time >= Infinity) return Infinity; 
        
        return work_path_time + energy_path_time + harvest_time + build_time;
    }


    let path_costs = creep.pos.estimatePathCosts(structure.pos, 3, creep, max_time - build_time);
    return path_costs + build_time;
}
/**
 * 
 * @param {QueueTask} queue_task 
 * @param {StructureSpawn} spawn
 * @return {string} 
 */
task.spawn = function(queue_task, spawn) {
    if (!spawn.allowSpawn()) return "";

    let parts = [MOVE, CARRY, WORK];
    let body = [MOVE, CARRY, WORK];

    let newName = "McGregor" + Game.time;
    let structure = Game.getObjectById(queue_task.id); //TODO: check if null
    let pos = structure.pos; //TODO: check if null
    let container = pos.findClosestStructure ((structure => {
        return structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE; 
    }));
    if (!container) {
        return spawn.spawnKevin();
    }
    
    let to_build = structure.progressTotal - structure.progress;
    
    while (spawn.spawnCreep(body, newName, { dryRun: true }) == 0) {
        let best_part = MOVE;
        let best_eff = 0;
        for (let part of parts){
            body.push(part);
            let frankencreep = new Frankencreep(container.pos, body, "Franky");
            let carry = body.filter(x => x == CARRY).length * 50;
            let time = task.estimateTime(frankencreep, queue_task, carry/best_eff);
            if (time == null || time == Infinity) {
                body.pop();
                continue;
            }
            let eff = Math.min(to_build,carry)/time;
            if(best_eff < eff){
                best_eff = eff;
                best_part = part;
            }
            body.pop();
        }
        body.push(best_part);
    }
    body.pop();
    if (body.length > 3 && spawn.spawnCreep(body, newName, {}) == OK) {
        return newName;
    }
    return "";
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
    let frankencreep = new Frankencreep(freePositions[0], creep.body.map((part) => part.type), "Franky");
    let energy_start = creep.store[RESOURCE_ENERGY] || creep.store.getFreeCapacity(RESOURCE_ENERGY);
    let use = Math.min(target.progressTotal - target.progress, 
                       creep.store[RESOURCE_ENERGY] || creep.store.getCapacity(RESOURCE_ENERGY));
    frankencreep.store[RESOURCE_ENERGY] = energy_start - use;
    return frankencreep;
}

export {task};