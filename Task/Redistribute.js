import {  QueueTask, CreepTask, findQueueTask, Task, State, takeFromStore, fillStructure, upgradeController } from "./Task";
import { FILL_SPAWN_PRIORITY, FILL_EXTENSION_PRIORITY, FILL_TOWER_PRIORITY, FILL_DEFAULT_PRIORITY, REDISTRIBUTE_DEFAULT_PRIORITY } from "../Constants";
import { error } from "../Logging";
import { Frankencreep } from "../FrankenCreep";
import "../RoomPosition";
import "../Game";

var task = new Task("redistribute", null);

task.updateQueue = () => {
    let storages = [];
    let rooms = Game.getOurRooms();
    
     rooms.forEach(room => {
         storages = storages.concat(room.find(FIND_MY_STRUCTURES, {
              filter: (structure) => {
                      return (structure.structureType == STRUCTURE_STORAGE) &&
                          structure.store.getFreeCapacity(RESOURCE_ENERGY) >= 500;
                  }
          }));
      });
    
    // Update the new task map
    Memory.new_tasks.redistribute = Memory.new_tasks.redistribute || [];
    for (let storage of storages) {
        if (!Memory.new_tasks.redistribute.find
                (redistribute_task => redistribute_task.id === storage.id)) {
            let queue_task = {id: storage.id || "", name:"redistribute", priority: 0};
            prioritize(queue_task, storage.structureType);
            Memory.new_tasks.redistribute.push(queue_task);
        }
    }
    
    // DELETION
    for (let i = 0; i < Memory.new_tasks.redistribute.length; i++) {
        let redistribute_task = Memory.new_tasks.redistribute[i];
        let structure = Game.getObjectById(redistribute_task.id);
        if (!structure || structure.store.getFreeCapacity(RESOURCE_ENERGY) < 500) {
            Memory.new_tasks.redistribute.splice(i, 1);
            i--;
        }
    }
}

/**
 * @param {QueueTask} queue_task 
 * @param {string} structure_type 
 */
function prioritize(queue_task, structure_type) {
    queue_task.priority = REDISTRIBUTE_DEFAULT_PRIORITY;
}

/**
 * @param {Creep} creep
 * @param {QueueTask} queue_task 
 * @return {CreepTask|null}
 */
task.take = (creep, queue_task) => {
    let structure = Game.getObjectById(queue_task.id);
    
    if (!structure) return null;
    

    let container  = /** @type {Structure} */ (creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (structure) => {
                return (structure.structureType === STRUCTURE_CONTAINER) &&
                    structure.store[RESOURCE_ENERGY] > 
                    0.5 * structure.store.getCapacity(RESOURCE_ENERGY);
        }
    }));
    if (!container) return null;

    let add_energy = Math.min(container.store[RESOURCE_ENERGY],creep.store.getCapacity(RESOURCE_ENERGY));
    if (!queue_task.expected_fillup) {
        queue_task.expected_fillup = add_energy;  
    } else {
        queue_task.expected_fillup += add_energy;
    }
    
    reprioritize(queue_task);
    
    let creep_task = {};
    
    creep_task.creep_exp_fill = add_energy;
    
     

    creep_task.store_id = container.id;
    creep_task.id = queue_task.id;
    creep_task.name = queue_task.name;
    
    //error("redistribute from ", creep_task.store_id, " (", container.pos, ") to ", creep_task.id, " (", Game.getObjectById(creep_task.id).pos, ")"  );

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
 * @param {number=} max_time
 * @return {number}
 */
task.estimateTime = function(creep, queue_task, max_time) {
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) < 100) 
        return Infinity;
    let storage = Game.getObjectById(queue_task.id);
    if (!storage) return Infinity;

    let container  = /** @type {Structure} */ (creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (structure) => {
                return (structure.structureType == STRUCTURE_CONTAINER) &&
                    structure.store[RESOURCE_ENERGY] > 
                    0.5 * structure.store.getCapacity(RESOURCE_ENERGY);
        }
    }));
    if (!container) return Infinity;

    let energy_path_time = creep.pos.estimatePathCosts(container.pos, 1, creep, max_time);
    if (energy_path_time >= Infinity) return Infinity;
    let work_path_time = container.pos.estimatePathCosts(storage.pos, 1, creep, max_time - energy_path_time);
    if (work_path_time >= Infinity) return Infinity; 
    
    return work_path_time + energy_path_time;
}

task.spawn = function(queue_task, spawn) {
    let stored_energy = spawn.room.storedEnergy();

    let parts = [];
    let body = [];
    if (stored_energy > 500) {
        body = [MOVE, CARRY, CARRY];
        parts = [MOVE, CARRY];
    } else {
        body = [MOVE, CARRY, CARRY, WORK];
        parts = [MOVE, MOVE, CARRY, WORK];
    }

    let newName = "Yak" + Game.time;
    let idx = 0;

    while (spawn.spawnCreep(body, newName, { dryRun: true }) == 0) {
        body.push(parts[idx]);
        idx = (idx + 1) % parts.length;
    }
    body.pop();

    if (body.length > 3 && spawn.spawnCreep(body, newName, {}) == OK){
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

