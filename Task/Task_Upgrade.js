import { QueueTask, CreepTask, Task, State, takeFromStore, upgradeController, findQueueTask } from "./Task";
import "../Game";
import {error} from "../Logging";
import { UPGRADE_HIGH_PRIORITY, UPGRADE_LOW_PRIORITY } from "../Constants";
import { Frankencreep } from "../FrankenCreep";

var task = new Task("upgrade", null);

task.updateQueue = () => {
    let controller = [];
    let rooms = Game.getOurRooms();
    
    rooms.forEach(room => {
        controller.push(room.controller);
    });
    
    Memory.new_tasks.upgrade = Memory.new_tasks.upgrade || [];
    for (let structure of controller) {
        if (!Memory.new_tasks.upgrade.find(controller_task => controller_task.id == structure.id)) {
            let queue_task = {id: structure.id, priority: UPGRADE_HIGH_PRIORITY, name:"upgrade"};
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
    
    //Object.assign(creep_task, getEnergyForTask(creep, queue_task).task);
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
    error ("calculating estimateTime for upgrade");
    let structure = /**@type {StructureController}*/ (Game.getObjectById(queue_task.id));
    if (!structure) return Infinity;
    if (creep.getActiveBodyparts(WORK) == 0) return Infinity;


    let energy = creep.store[RESOURCE_ENERGY] || creep.store.getCapacity(RESOURCE_ENERGY);
    let upgrade_time = energy/creep.getActiveBodyparts(WORK);

    if (!creep.store[RESOURCE_ENERGY]) {
        let energy_struct = creep.findOptimalEnergy(max_time - upgrade_time);
        if (!energy_struct || !energy_struct.object) return Infinity;

        let harvest_time = 0;
        if (energy_struct.type == FIND_SOURCES) {
            if (creep.getActiveBodyparts(WORK) == 0) return Infinity;
            let capacity = creep.store.getFreeCapacity(RESOURCE_ENERGY);
            harvest_time = capacity / (2 * creep.getActiveBodyparts(WORK));
        }

        let energy_path_time = creep.pos.estimatePathCosts(energy_struct.object.pos, 1, creep, max_time - harvest_time - upgrade_time);
        if (energy_path_time >= Infinity) return Infinity;
        let work_path_time = energy_struct.object.pos.estimatePathCosts(structure.pos, 3, creep, max_time - harvest_time - energy_path_time - upgrade_time);
        if (work_path_time >= Infinity) return Infinity; 
        error (" time is ", work_path_time + energy_path_time + harvest_time + upgrade_time);
        
        return work_path_time + energy_path_time + harvest_time + upgrade_time;
    }
    
    let path_costs = creep.pos.estimatePathCosts(structure.pos, 3, creep, max_time - upgrade_time);
    if (path_costs >= Infinity) return Infinity;
    error (" time is ", path_costs + upgrade_time);
    return path_costs + upgrade_time;
}

task.spawn = function(queue_task, spawn) {
    if (!spawn.allowSpawn()) return "";

    let parts = [MOVE, CARRY, WORK];
    let body = [MOVE, CARRY, WORK];

    let newName = "Ash" + Game.time;
    let pos = Game.getObjectById(queue_task.id).pos; //TODO: check if null
    let container = pos.findClosestStructure ((structure => {
        return structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE; 
    }));
  //  error("container ", container.pos);
  //  error("controller ", pos);
    if (!container) {
        return spawn.spawnKevin();
    }
    while (spawn.spawnCreep(body, newName, { dryRun: true }) == 0) {
        let best_part = MOVE;
        let best_eff = 0;
        for (let part of parts){
            body.push(part);
            let frankencreep = new Frankencreep(container.pos, body, "Franki");
            let carry = body.filter(x => x == CARRY).length * 50;
            let time = task.estimateTime(frankencreep, queue_task, carry/best_eff);
            //error(body, time, " ", carry);
            if (time == null || time == Infinity) {
                body.pop();
                continue;
            }
            let eff = carry/time;
            //error(body, eff);
            if(best_eff < eff){
                best_eff = eff;
                best_part = part;
            }
            body.pop();
        }
        body.push(best_part);
    }
    body.pop();
    if (body.length > 3 &&  spawn.spawnCreep(body, newName, {}) == OK) {
        return newName;
    }
    return "";
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
    return frankencreep;
}


task.state_array = [
    new State(takeFromStore),
    new State(upgradeController),
];


export {task};
