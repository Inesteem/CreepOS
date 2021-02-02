import { getFreeStore, getUnclaimedFlags, getStoresWithEnergy } from '../Base';
import { error, info } from "../Logging";
import "../RoomPosition";
import "../Creep";

/** @typedef {{id: string, priority: number, name: string}} */
export var QueueTask;
/** @typedef {{id: string, name: string}} */
export var CreepTask;

const giveup_time = 250;//TODO : move to constants

/**
 * @constructor
 * @param {!(function(Creep):boolean)} func 
 */
function State(func){
    this.func = func;
}
 
/**
 * @constructor
 * @param {string} name 
 * @param {?State} initial_state 
 */
function Task(name, initial_state){
    this.name = name;
    
    if (initial_state)
        this.initial_state = initial_state;
}

/**
 * 
 * @param {Creep} creep 
 * @return {boolean} False if the creep's task is finished.
 */
Task.prototype.run = function(creep) {
    if (!creep.memory.task.current_state) {
        creep.memory.task.current_state = 0;
    }
    if (creep.memory.task.current_state >= this.state_array.length ||
            creep.memory.ticks > giveup_time) {
        return false;
    }
    let result = this.state_array[creep.memory.task.current_state].func(creep);
    if (!result) {
        creep.memory.task.current_state++;
        this.run(creep);
    }
    if (creep.memory.task.current_state >= this.state_array.length) {
        return false;
    }
    return true;
}

/**
 * 
 * @param {Creep} creep 
 */
function takeFromStore(creep) {
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
        return false;
    }
    if (!creep.memory.task.store_id && !creep.memory.task.source_id) { // && !creep.memory.task.resource_id) {
        Object.assign(creep.memory.task, getEnergyForTask(creep, creep.memory.task).task);
    }
    if (creep.memory.task.store_id) {
        let storage = Game.getObjectById(creep.memory.task.store_id);

        if (!storage || storage.store[RESOURCE_ENERGY] == 0) {
            return false;
        }
    
        creep.takeFrom(storage);

        return true;
    } else if (creep.memory.task.source_id) {
        let source = Game.getObjectById(creep.memory.task.source_id)
        
        if (!source || source.energy == 0) {
            return false;
        }

        if (!creep.harvestFrom(source) && !source.hasFreeSpot()) {
            return false;
        }

        return true;
    } else if (creep.memory.task.resource_id) {
        let resource = Game.getObjectById(creep.memory.task.resource_id);

        if (!resource) {
            return false;
        }

        creep.collectDroppedResource(resource);
        return true;
    }
    return false;
}

/**
 * 
 * @param {Creep} creep 
 */
function upgradeController(creep){
    let controller = Game.getObjectById(creep.memory.task.id);

    if (!controller) return false;

    creep.upgrade(controller);
    
    if (creep.store[RESOURCE_ENERGY] == 0){
        return false;
    }
    
    return true;
}

/**
 * 
 * @param {Creep} creep 
 */
function fillStructure(creep) {
    const structure = Game.getObjectById(creep.memory.task.id);
    
    if(!structure || creep.store[RESOURCE_ENERGY] == 0 || 
            structure.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
        return false;
    }
    
    creep.storeAt(structure);
    
    return true;
}

/**
 * Finds the closest energy source for the task if one is needed at all.
 * @param {Creep} creep 
 * @param {{id: string}} queue_task 
 * @param {number=} max_time
 * @return {{task: {source_id: (string | undefined), store_id: (string | undefined)}, object: ?RoomObject}} 
 */
function getEnergyForTask(creep, queue_task, max_time) {
    info("getEnergyForTask", queue_task);
    let result = {task: {}, object: null};
    if (creep.store[RESOURCE_ENERGY]) return result;
    
    let target = queue_task.id && Game.getObjectById(queue_task.id);
    
    if (!target) return result;

    let energy = creep.findOptimalEnergy(max_time);

    if (!energy) return result;

    if (energy.type == FIND_STRUCTURES) {
        return {task: {store_id: energy.object.id}, object: energy.object};
    } else if (energy.type == FIND_SOURCES) {
        return {task: {source_id: energy.object.id}, object: energy.object};  
    } else {
        return {task: {drop_id: energy.object.id}, object: energy.object};
    }
}


/**
 * 
 * @param {string} task_name 
 * @param {string} id 
 * @return {QueueTask}
 */
function findQueueTask(task_name, id) {
    return Memory.new_tasks[task_name].find(queue_task => queue_task.id === id);
}
export {
    Task,
    State,
    takeFromStore,
    upgradeController,
    fillStructure,
    getEnergyForTask,
    findQueueTask,
};