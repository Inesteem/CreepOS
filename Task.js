var base = require('Base');
var constants = require('Constants');
var log = require("Logging");
var algorithm = require("Algorithm");

const giveup_time = 250;//TODO : move to constants
 
function State(func){
    if (typeof func !== 'function') {
        log.error("Creating state without function!");
        return;
    }
    this.func = func;
}
 
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

var harvestClosest = function(creep) {
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

var fillStore = function(creep) {
    let target = getTarget(base.getFreeStore, creep, 'target_id');
    
    if (!target || target.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
        return false;
    }
    creep.storeAt(target);
    if (creep.store[RESOURCE_ENERGY] == 0)
        return false;
    return true;
}

var takeFromStore = function(creep) {
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

var upgradeController = function (creep){
    let controller = Game.getObjectById(creep.memory.task.id);

    if (!controller) return false;

    creep.upgrade(controller);
    
    if (creep.store[RESOURCE_ENERGY] == 0){
        return false;
    }
    
    return true;
}

var fillStructure = function (creep) {
    const structure = Game.getObjectById(creep.memory.task.id);
    
    if(!structure || creep.store[RESOURCE_ENERGY] == 0 || 
            structure.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
        return false;
    }
    
    creep.storeAt(structure);
    
    return true;
}

function claimRoom(creep) {
    const flags = base.getUnclaimedFlags();
    if (flags.length > 0) {
        creep.moveToRoom(flags[0]);
    } else {
        creep.claimRoom();
    }
    
    return true;
}

function getHasEnergyFunction(room) {
    let stores = base.getStoresWithEnergy(room);
    if (stores.length) {
        return {func: function(pos) {
            let structures = room.lookForAtArea(LOOK_STRUCTURES,Math.max(0, pos.y -1), Math.max(0, pos.x -1), Math.min(49, pos.y + 1), Math.min(49, pos.x +1), true);
            let result = false;
            for (let structure of structures) {
                if (structure.structure.structureType == STRUCTURE_CONTAINER) {
                    result = result || structure.structure.store[RESOURCE_ENERGY] > 0;
                }
            }
            return result;
        }, type: 'store_id'};
    } else {
        return {func: function(pos) {
            let sources = room.lookForAtArea( LOOK_SOURCES, Math.max(0, pos.y -1), Math.max(0, pos.x -1), Math.min(49, pos.y + 1), Math.min(49, pos.x +1), true);
            for (let source of sources) {
                if (source.source.energy > 0) {
                    return true;
                }
            }
            return false;
        }, type: 'source_id'};
    }
}

// Finds the closest energy source for the task if one is needed at all.
// Returns {task: {}, object: null} if no energy is required or no source/store is found.
// Returns the energy target object in the form {task: {source_id: id} or {store_id: id}, object: ... }
function getEnergyForTask(creep, queue_task) {
    let result = {task: {}, object: null};
    if (creep.store[RESOURCE_ENERGY]) return result;
    
    let target = queue_task.id && Game.getObjectById(queue_task.id);
    
    if (!target) return result;
    
    let stores = base.getStoresWithEnergy(creep.room);
    if (stores.length) {
        let store = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => 
                structure.structureType == STRUCTURE_CONTAINER 
                    && structure.store[RESOURCE_ENERGY] > 0
        });
        if (!store) {
            let source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            if (source)
                return {task: {source_id: source.id}, obejct: source};    
        } else {
            return {task: {store_id: store.id}, object: store};
        }
    } else {
        let source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
        if (source)
            return {task: {source_id: source.id}, obejct: source};
    }
    return result;
}

module.exports = {
    Task:Task,
    State: State,
    takeFromStore: takeFromStore,
    harvestClosest: harvestClosest,
    fillStore: fillStore,
    upgradeController: upgradeController,
    fillStructure: fillStructure,
    claimRoom: claimRoom,
    getEnergyForTask: getEnergyForTask,
};