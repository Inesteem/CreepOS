import { error, info, warning } from "../Logging";
import "../GameObjects/RoomPosition";
import "../GameObjects/Creep";
import { INFINITY } from "../Constants";

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
 */
function Task(name){
    this.name = name;
}

Object.defineProperty(Task.prototype, 'queue', {
    get:  function() {
        let self = this;
        if(!Memory.new_tasks) {
            Memory.new_tasks = {};
        }
        if(!Memory.new_tasks[self.name]) {
            Memory.new_tasks[self.name] = [];
        }
        return Memory.new_tasks[self.name];
    },
    set: function(value) {
        let self = this;
        if(!Memory.new_tasks) {
            Memory.new_tasks = {};
        }
        if(!Memory.new_tasks[self.name]) {
            Memory.new_tasks[self.name] = [];
        }
        Memory.new_tasks[self.name] = value;
    }
});

/**
 * 
 * @param {Creep} creep 
 * @return {boolean} False if the creep's task is finished.
 */
Task.prototype.run = function(creep) {
    if (!creep.task.current_state) {
        creep.task.current_state = 0;
    }
    if (creep.task.current_state >= this.state_array.length ||
            creep.memory.ticks > giveup_time) {
        return false;
    }
    let result = this.state_array[creep.task.current_state].func(creep);
    if (!result) {
        creep.task.current_state++;
        this.run(creep);
    }
    if (creep.task.current_state >= this.state_array.length) {
        return false;
    }
    return true;
}

Task.prototype.updateQueue = function() {
    warning("updateQueue not implemented for ", this.name);
}

Task.prototype.take = function() {
    error("take not implemented for ", this.name);
}

Task.prototype.finish = function() {
    error("finish not implemented for ", this.name);
}

/**
 * 
 * @param {Creep} creep 
 * @param {QueueTask} queue_task 
 * @param {number=} max_time 
 * @return {number}
 */
Task.prototype.estimateTime = function(creep, queue_task, max_time) {
    error("estimateTime not implemented for ", this.name);
    return INFINITY;
}

Task.prototype.spawn = function() {
    error("spawn not implemented for ", this.name);
}

Task.prototype.creepAfter = function() {
    error("creepAfter not implemented for ", this.name);
}
/**
 * 
 * @param {Creep} creep 
 */
function takeFromStore(creep) {
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
        let sources = Game.find(
                FIND_SOURCES_ACTIVE,
                {filter : (source) => creep.pos.inRangeTo(source.pos, 1) }
        );
        if(sources.length){
            creep.moveAwayFrom(sources[0], 2);
            return false;
        }
        return false;
    }
    if (!creep.task.store_id && !creep.task.source_id) { // && !creep.task.resource_id) {
        let target = null;
        if (creep.task.id) {
            target = Game.getObjectById(creep.task.id);
        }
        Object.assign(creep.task, getEnergyForTask(target ? target.pos : creep.pos, creep, creep.task).task);
        //reserveSlot
        if (creep.task.source_id){
            let source = Game.getObjectById(creep.task.source_id);
            source.reserveSlot(Game.time + creep.task.path_time, Game.time + creep.task.harvest_time + creep.task.path_time, creep.store.getFreeCapacity(RESOURCE_ENERGY));
        }
    }
    if (creep.task.store_id) {
        let storage = Game.getObjectById(creep.task.store_id);

        if (!storage || storage.store[RESOURCE_ENERGY] == 0) {
            return false;
        }
    
        creep.takeFrom(storage);

        return true;
    } else if (creep.task.source_id) {
        let source = Game.getObjectById(creep.task.source_id)
        
        if (!source || source.energy == 0) {
            return false;
        }
        
        if (!creep.harvestFrom(source)  && !source.hasFreeSpot()) {
            
            return false;
        }

        return true;
    } else if (creep.task.resource_id) {
        let resource = Game.getObjectById(creep.task.resource_id);

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
function fillStructure(creep) {
    const structure = Game.getObjectById(creep.task.id);
    
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
function getEnergyForTask(pos, creep, queue_task, max_time) {
    info("getEnergyForTask", queue_task);
    let result = {task: {}, object: null};
    if (creep.store[RESOURCE_ENERGY]) return result;
    
    let target = queue_task.id && Game.getObjectById(queue_task.id);
    
    if (!target) return result;

    let energy = /** @type {{type: number, object: RoomObject, path_time: number, harvest_time: (number|undefined)}|null} */ 
        (creep.findOptimalEnergy(pos, max_time));

    if (!energy) return result;

    if (energy.type == FIND_STRUCTURES) {
        return {task: {store_id: energy.object.id}, object: energy.object};
    } else if (energy.type == FIND_SOURCES) {
        return {task: {source_id: energy.object.id, path_time: energy.path_time, harvest_time: energy.harvest_time}, object: energy.object};  
    } else {
        return {task: {drop_id: energy.object.id}, object: energy.object};
    }
}


/**
 * 
 * @param {string} task_name 
 * @param {string} id 
 * @return {QueueTask | null}
 */
function findQueueTask(task_name, id) {
    if (!Memory.new_tasks[task_name]) return null;
    return Memory.new_tasks[task_name].find(queue_task => queue_task.id === id);
}
export {
    Task,
    State,
    takeFromStore,
    fillStructure,
    findQueueTask,
};