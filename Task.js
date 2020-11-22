/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Task');
 * mod.thing == 'a thing'; // true
 */
 
function State(func){
    this.func = func;
}
 
function Task(name, initial_state){
    this.name = name;
    
    if (initial_state)
        this.initial_state = initial_state;
}

 
function createBuildTask(structure_id){
    var task = new Task("build_structure_"+structure_id, null);

    task.state_array = [
        new State((creep)=>{
            creep.memory.task.structure_id = structure_id;
            return false;
        }),
        new State(takeFromStore),
        new State(buildStructure),
    ];
    return task;
}



Task.prototype.run = function(creep) {
    if (!creep.memory.task.current_state) {
        creep.memory.task.current_state = 0;
    }
    if (creep.memory.task.current_state >= this.state_array.length) {
        creep.memory.task = null;
        return false;
    }
    
    result = this.state_array[creep.memory.task.current_state].func(creep);
    if (!result) {
        creep.memory.task.current_state++;
    }
    return true;
}

var harvestClosest = function(creep) {
    if (!creep.memory.task.source_id){
        source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
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
    var storage = null;
    if (!creep.memory.task.storage_id) {
        storage  = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE ||
                    structure.structureType == STRUCTURE_CONTAINER) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
        });
        if (storage) 
            creep.memory.task.storage_id = storage.id;
        else
            return false;
    } else {
        storage = Game.getObjectById(creep.memory.task.storage_id);
    }
    creep.storeAt(storage);
    if (creep.store[RESOURCE_ENERGY] == 0 ||
        storage.store.getFreeCapacity(RESOURCE_ENERGY) == 0)
        return false;
    return true;
}

var takeFromStore = function(creep) {
    var storage = null;
    if (!creep.memory.task.storage_id) {
        storage  = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE ||
                    structure.structureType == STRUCTURE_CONTAINER) &&
                        structure.store[RESOURCE_ENERGY] >= 
                            creep.store.getFreeCapacity();
                }
        });
        if (storage) 
            creep.memory.task.storage_id = storage.id;
        else {
            // Harvest if there's no store available to take from.
            var source = null;
            if (!creep.memory.task.source_id){
                source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                if (source)
                    creep.memory.task.source_id = source.id;
                else {
                    return false;
                }
            }
            var source = Game.getObjectById(creep.memory.task.source_id)
            if (!source) {
                creep.memory.task.source_id = null;
                return true;
            }
            
            creep.harvestFrom(source);
        
            if (creep.store.getFreeCapacity() == 0) return false;
            return true;
        }
    } else {
        storage = Game.getObjectById(creep.memory.task.storage_id);
    }
    if (!storage) {
        creep.memory.task.storage_id = null;
        return true;
    }
    creep.takeFrom(storage);
    if (creep.store.getFreeCapacity() == 0 ||
        storage.store[RESOURCE_ENERGY] == 0)
        return false;
    return true;
}

var fillSpawn = function(creep) {
    var structure = null;
    if (!creep.memory.task.structure_id){
        structure  = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION || 
                        structure.structureType == STRUCTURE_SPAWN) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
        });
        if (!structure)
            return false;
        creep.memory.task.structure_id = structure.id;
    } else {
        structure = Game.getObjectById(creep.memory.task.structure_id);
    }
    creep.storeAt(structure);
    if (creep.store[RESOURCE_ENERGY] == 0 ||
            structure.store.getFreeCapacity(RESOURCE_ENERGY)== 0)
        return false;
    return true;
};

var upgradeController = function (creep){
    creep.upgrade();
    if (creep.store[RESOURCE_ENERGY] == 0){
        return false;
    }
    return true;
}


var buildStructure = function (creep){
    structure = Game.getObjectById(creep.memory.task.structure_id);
    
    if(!structure){
        return false;
    }
    
    creep.buildStructure(structure);
    
    if (creep.store[RESOURCE_ENERGY] == 0) {
        return false;
    }
    return true;
}


var buildClosest = function (creep){
    var structure = null
    if (!creep.memory.task.structure_id){
        structure = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
        if(!structure) 
            return false;
        creep.memory.task.structure_id = structure.id;
    } else {
        structure = Game.getObjectById(creep.memory.task.structure_id);
    }
    
    if(!structure){
        creep.memory.task.structure_id = null;
        return true;
    }
    creep.buildStructure(structure);
    
    if (creep.store[RESOURCE_ENERGY] == 0) {
        return false;
    }
    return true;
}

var repairClosest = function (creep) {
    var structure = null
    if (!creep.memory.task.structure_id){
        structure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: object => object.hits < object.hitsMax && object.hits < 250000
        });
        if(!structure) 
            return false;
        creep.memory.task.structure_id = structure.id;
    } else {
        structure = Game.getObjectById(creep.memory.task.structure_id);
    }
    
    if(!structure){
        creep.memory.task.structure_id = null;
        return true;
    }
    creep.repairStructure(structure);
    
    if (creep.store[RESOURCE_ENERGY] == 0 ||
            !(structure.hits < structure.hitsMax && structure.hits < 250000)) {
        return false;
    }
    return true;
}

var repair_task = new Task("repair", null);

repair_task.state_array = [
    new State(takeFromStore),
    new State(repairClosest),
]

var fill_store_task = new Task("fill_store", null);

fill_store_task.state_array = [
    new State(harvestClosest),
    new State(fillStore),
]

var fill_spawn_task = new Task("fill_spawn", null);

fill_spawn_task.state_array = [
    new State(takeFromStore),
    new State(fillSpawn),
];

var upgrade_controller_task = new Task("upgrade", null);

upgrade_controller_task.state_array = [
    new State(takeFromStore),
    new State(upgradeController),
];

var build_closest_task = new Task("build", null);

build_closest_task.state_array = [
    new State(takeFromStore),
    new State(buildClosest),
];


module.exports = {
    Task:Task,
    fill_spawn_task: fill_spawn_task,
    upgrade_controller_task: upgrade_controller_task,
    build_closest_task: build_closest_task,
    fill_store_task: fill_store_task,
    repair_task: repair_task,
    create_build_task: createBuildTask,
};