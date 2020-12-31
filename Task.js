/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Task');
 * mod.thing == 'a thing'; // true
 */
var base = require('Base');
var constants = require('Constants');
const giveup_time = 250;//TODO : move to constants
 
function State(func){
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
        creep.memory.old_task = creep.memory.task;
        creep.memory.task = null;
        return false;
    }
    
    const result = this.state_array[creep.memory.task.current_state].func(creep);
    if (!result) {
        creep.memory.task.current_state++;
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


var buildStructure = function (creep){
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

var repairStructure = function (creep) {
    let structure = Game.getObjectById(creep.memory.task.id);
    
    if(!structure){
        return false;
    }
    
    creep.repairStructure(structure);
    
    if (creep.store[RESOURCE_ENERGY] == 0 ||
            structure.hits == structure.hitsMax) {
        return false;
    }
    return true;
}

var fillStructure = function (creep) {
    const structure = Game.getObjectById(creep.memory.task.id);
    
    if(!structure){
        return false;
    }
    
    creep.storeAt(structure);
    
    if (creep.store[RESOURCE_ENERGY] == 0 || 
            structure.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
        return false;
    }
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

function collectDroppedEnergy(creep) {
    return true;
    let resource = Game.getObjectById(creep.memory.task.resource);
    if(resource && creep.store.getFreeCapacity() == 0){
        creep.collectDroppedResource(resource);
        return true;
    }
    
    return true;
}

var claim_room_task = new Task("claim_room", null);

claim_room_task.state_array = [
    new State(claimRoom),    
]

var repair_task = new Task("repair", null);

repair_task.state_array = [
    new State(takeFromStore),
    new State(repairStructure),
]

var fill_store_task = new Task("fill_store", null);

fill_store_task.state_array = [
    new State(harvestClosest),
    new State(fillStore),
]

var upgrade_controller_task = new Task("upgrade", null);

upgrade_controller_task.state_array = [
    new State(takeFromStore),
    new State(upgradeController),
];

var build_closest_task = new Task("build", null);

build_closest_task.state_array = [
    new State(takeFromStore),
    new State(buildStructure),
];

var fill_structure_task = new Task("fill_structure", null);

fill_structure_task.state_array = [
    new State(takeFromStore),
    new State(fillStructure)
];


var collect_dropped_energy_task = new Task("collect_dropped_energy", null);

collect_dropped_energy_task.state_array = [
    new State(collectDroppedEnergy),
];

module.exports = {
    Task:Task,
    upgrade_controller_task: upgrade_controller_task,
    build_closest_task: build_closest_task,
    fill_store_task: fill_store_task,
    claim_room_task: claim_room_task,
    repair_task: repair_task,
    fill_structure_task: fill_structure_task,
    collect_dropped_energy_task : collect_dropped_energy_task,
};