import { getFreeStore, getUnclaimedFlags, getStoresWithEnergy } from './Base';
import { error } from "./Logging";
import { QueueTask, CreepTask } from "./Scheduler";

const giveup_time = 250;//TODO : move to constants

/**
 * @constructor
 * @param {!(function(Creep):boolean)} func 
 */
function State(func){
    if (typeof func !== 'function') {
        error("Creating state without function!");
        error(func);
        return;
    }
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
    return true;
}

function getTarget(targetFunc, creep, id_name) {
    let target = null;
    if (!creep.memory.task[id_name]) {
        target = targetFunc(creep);
        if (target) {
            creep.memory.task[id_name] = target.id;
        }
    } else {
        target = Game.getObjectById(creep.memory.task[id_name]);
    }
    return target;
}

function harvestClosest(creep) {
    if (!creep.memory.task.source_id){
        let source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
        if (source)
            creep.memory.task.source_id = source.id;
        else {
            return false;
        }
    }
    creep.harvestFrom(Game.getObjectById(creep.memory.task.source_id));
    
    if (creep.store.getFreeCapacity() == 0) return false;
    return true;
};

function fillStore(creep) {
    let target = getTarget(getFreeStore, creep, 'target_id');
    
    if (!target || target.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
        return false;
    }
    creep.storeAt(target);
    if (creep.store[RESOURCE_ENERGY] == 0)
        return false;
    return true;
}

function takeFromStore(creep) {
    let storage = null;
    if (!creep.memory.task.store_id) {
        if (!creep.memory.task.source_id){
            return false;
        }
        let source = Game.getObjectById(creep.memory.task.source_id)
        
        if (!source) {
            return false;
        }
        creep.harvestFrom(source);
        
        if (creep.store.getFreeCapacity() == 0) return false;
        
        return true;
    }
    
    storage = Game.getObjectById(creep.memory.task.store_id);

    if (!storage) {
        return false;
    }
    
    creep.takeFrom(storage);
    
    if (creep.store[RESOURCE_ENERGY] != 0 ||
        storage.store[RESOURCE_ENERGY] == 0) {
        return false;
    }
    
    return true;
}

function upgradeController(creep){
    let controller = Game.getObjectById(creep.memory.task.id);

    if (!controller) return false;

    creep.upgrade(controller);
    
    if (creep.store[RESOURCE_ENERGY] == 0){
        return false;
    }
    
    return true;
}

function fillStructure(creep) {
    const structure = Game.getObjectById(creep.memory.task.id);
    
    if(!structure || creep.store[RESOURCE_ENERGY] == 0 || 
            structure.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
        return false;
    }
    
    creep.storeAt(structure);
    
    return true;
}

function claimRoom(creep) {
    const flags = getUnclaimedFlags();
    if (flags.length > 0) {
        creep.moveToRoom(flags[0]);
    } else {
        creep.claimRoom();
    }
    
    return true;
}

// Finds the closest energy source for the task if one is needed at all.
// Returns {task: {}, object: null} if no energy is required or no source/store is found.
// Returns the energy target object in the form {task: {source_id: id} or {store_id: id}, object: ... }
/**
 * 
 * @param {Creep} creep 
 * @param {QueueTask} queue_task 
 * @return {{task: {source_id: (string | undefined), store_id: (string | undefined)}, object: ?RoomObject}} 
 */
function getEnergyForTask(creep, queue_task) {
    let result = {task: {}, object: null};
    if (creep.store[RESOURCE_ENERGY]) return result;
    
    let target = queue_task.id && Game.getObjectById(queue_task.id);
    
    if (!target) return result;
    
    let stores = getStoresWithEnergy(creep.room);
    if (stores.length) {
        let store = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => 
                structure.structureType == STRUCTURE_CONTAINER 
                    && structure.store[RESOURCE_ENERGY] > creep.store.getFreeCapacity(RESOURCE_ENERGY)
        });
        if (!store) {
            let source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            if (source)
                return {task: {source_id: source.id}, object: source};    
        } else {
            let result = {task: {store_id: store.id}, object: store};
            return result;
        }
    } else {
        let source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
        if (source)
            return {task: {source_id: source.id}, object: source};
    }
    return result;
}

function findQueueTask(task_name, id) {
    return Memory.new_tasks[task_name].find(queue_task => queue_task.id === id);
}
export {
    Task,
    State,
    takeFromStore,
    harvestClosest,
    fillStore,
    upgradeController,
    fillStructure,
    claimRoom,
    getEnergyForTask,
    findQueueTask,
};