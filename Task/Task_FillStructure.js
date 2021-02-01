import {  QueueTask, CreepTask, getEnergyForTask, findQueueTask, Task, State, takeFromStore, fillStructure, upgradeController } from "./Task";
import { getOurRooms } from "../Base";;
import { FILL_SPAWN_PRIORITY, FILL_EXTENSION_PRIORITY, FILL_TOWER_PRIORITY, FILL_DEFAULT_PRIORITY } from "../Constants";
import { error } from "../Logging";
import { Frankencreep } from "../FrankenCreep";
import { storedEnergy } from "../Game";
import "../RoomPosition";

var task = new Task("fill_structure", null);

task.updateQueue = () => {
    let structures = [];
    let rooms = getOurRooms();
    
    // SPAWN
    
    rooms.forEach(room => {
       structures = structures.concat(room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                    return ( structure.structureType == STRUCTURE_SPAWN ||
                            structure.structureType == STRUCTURE_EXTENSION || 
                            structure.structureType == STRUCTURE_TOWER) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
        }));
    });
    
    // Update the new task map
    Memory.new_tasks.fill_structure = Memory.new_tasks.fill_structure || [];
    for (let structure of structures) {
        if (!Memory.new_tasks.fill_structure.find
                (fill_task => fill_task.id == structure.id)) {
            let queue_task = {id: structure.id || "", name:"fill_structure", priority: 0};
            prioritize(queue_task, structure.structureType);
            Memory.new_tasks.fill_structure.push(queue_task);
        }
    }
    
    // DELETION
    for (let i = 0; i < Memory.new_tasks.fill_structure.length; i++) {
        let fill_task = Memory.new_tasks.fill_structure[i];
        let structure = Game.getObjectById(fill_task.id);
        if (!structure || structure.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
            Memory.new_tasks.fill_structure.splice(i, 1);
            i--;
        }
    }
}

/**
 * @param {QueueTask} queue_task 
 * @param {string} structure_type 
 */
function prioritize(queue_task, structure_type) {
    let structure = Game.getObjectById(queue_task.id);
    
    switch (structure_type) {
        case (STRUCTURE_SPAWN):
            queue_task.priority = FILL_SPAWN_PRIORITY;
            break;
        case (STRUCTURE_EXTENSION):
            queue_task.priority = FILL_EXTENSION_PRIORITY;
            break;
        case (STRUCTURE_TOWER):
            queue_task.priority = FILL_TOWER_PRIORITY;
            break;
        default:
            queue_task.priority = FILL_DEFAULT_PRIORITY;
    };
}
/**
 * @param {Creep} creep
 * @param {QueueTask} queue_task 
 * @return {CreepTask|null}
 */
task.take = (creep, queue_task) => {
    let structure = Game.getObjectById(queue_task.id);
    
    if (!structure) return null;
    
    let add_energy = creep.store[RESOURCE_ENERGY] || creep.store.getCapacity(RESOURCE_ENERGY);
    if (!queue_task.expected_fillup) {
        queue_task.expected_fillup = add_energy;  
    } else {
        queue_task.expected_fillup += add_energy;
    }
    
    reprioritize(queue_task);
    
    let creep_task = {};
    
    creep_task.creep_exp_fill = add_energy;
    
    //Object.assign(creep_task, getEnergyForTask(creep, queue_task).task);
    creep_task.id = queue_task.id;
    creep_task.name = queue_task.name;
    
    return creep_task;
}

function reprioritize(queue_task) {
    if (!queue_task.expected_fillup) queue_task.expected_fillup = 0;
    let fillup = queue_task.expected_fillup;
    let structure = Game.getObjectById(queue_task.id);
    if (!structure || fillup >= structure.store.getFreeCapacity(RESOURCE_ENERGY)) {
        queue_task.priority = 0;
    } else {
        prioritize(queue_task, structure.structureType);
    }
}

/**
 * 
 * @param {Creep} creep 
 * @param {{name: string, id: string, creep_exp_fillup: number}} creep_task 
 */
task.finish = (creep, creep_task) => {
    let queue_task = findQueueTask(creep_task.name, creep_task.id);
    if (queue_task && queue_task.expected_fillup) {
        queue_task.expected_fillup -= creep_task.creep_exp_fillup;
    }
    if (queue_task)
        reprioritize(queue_task);
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

    let fatigue_decrease = creep.getActiveBodyparts(MOVE) * 2;
    let fatigue_base = creep.body.length - creep.getActiveBodyparts(MOVE);
    let path_costs = creep.pos.getPathCosts(structure.pos, 1, fatigue_base, fatigue_decrease, max_cost);

    let harvest_time = 0;
    let energy = creep.store.getFreeCapacity(RESOURCE_ENERGY);
    if (energy > storedEnergy()) {
        harvest_time = Math.max(0, (energy - storedEnergy())) / (2 * creep.getActiveBodyparts(WORK));
    }

    return path_costs + harvest_time;
}

task.spawn = function(queue_task, room) {
    let stored_energy = room.storedEnergy();

    let parts = [];
    let body = [];
    if (stored_energy > 500) {
        body = [MOVE, CARRY];
        parts = [MOVE, CARRY];
    } else {
        body = [MOVE, MOVE, CARRY, WORK];
        parts = [MOVE, MOVE, CARRY, WORK];
    }

    let newName = "Muli" + Game.time;
    let idx = 0;

    while (room.spawnCreep(body, newName, { dryRun: true }) == 0) {
        body.push(parts[idx]);
        idx = (idx + 1) % parts.length;
    }
    body.pop();

    if (body.length > 3 && room.spawnCreep(body, newName, {}) == OK){
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
    let energy_start = creep.store[RESOURCE_ENERGY] || creep.store.getFreeCapacity(RESOURCE_ENERGY);
    let use = Math.min(energy_start, target.store.getFreeCapacity(RESOURCE_ENERGY));
    frankencreep.store[RESOURCE_ENERGY] = energy_start - use;
    return frankencreep;
}

task.state_array = [
    new State(takeFromStore),
    new State(fillStructure)
];

export { task };
