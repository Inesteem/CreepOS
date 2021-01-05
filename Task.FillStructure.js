var tasks = require("Task");
var base = require("Base");;
var constants = require("Constants");
var log = require("Logging");

function updateQueue() {
    let structures = [];
    let rooms = base.getOurRooms();
    
    // SPAWN
    
    rooms.forEach(room => {
       structures = structures.concat(room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                    return ( structure.structureType == STRUCTURE_SPAWN ||
                            structure.structureType == STRUCTURE_EXTENSION || 
                            structure.structureType == STRUCTURE_TOWER ) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
        }));
    });
    
    // Update the new task map
    Memory.new_tasks.fill_structure = Memory.new_tasks.fill_structure || [];
    for (let structure of structures) {
        if (!Memory.new_tasks.fill_structure.find
                (fill_task => fill_task.id == structure.id)) {
            let queue_task = {id: structure.id, name:"fill_structure"};
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

function prioritize(queue_task, structure_type) {
    let structure = Game.getObjectById(queue_task.id);
    
    switch (structure_type) {
        case (STRUCTURE_SPAWN):
            queue_task.priority = constants.FILL_SPAWN_PRIORITY;
            break;
        case (STRUCTURE_EXTENSION):
            queue_task.priority = constants.FILL_EXTENSION_PRIORITY;
            break;
        case (STRUCTURE_TOWER):
            queue_task.priority = constants.FILL_TOWER_PRIORITY;
            break;
        default:
            queue_task.priority = constants.FILL_DEFAULT_PRIORITY;
    };
}

function take(creep, queue_task) {
    let structure = Game.getObjectById(queue_task.id);
    
    if (!structure) return null;
    
    let add_energy = creep.store[RESOURCE_ENERGY] || creep.store.getCapacity();
    if (!queue_task.expected_fillup) {
        queue_task.expected_fillup = add_energy;
        
    } else {
        queue_task.expected_fillup += add_energy;
    }
    
    reprioritize(queue_task);
    
    let creep_task = {};
    
    creep_task.creep_exp_fill = add_energy;
    
    Object.assign(creep_task, tasks.getEnergyForTask(creep, queue_task).task);
    
    Object.assign(creep_task, queue_task);
    
    return creep_task;
}

function reprioritize(queue_task) {
    if (!queue_task.expected_fillup) queue_task.expected_fillup =0;
    let fillup = queue_task.expected_fillup;
    let structure = Game.getObjectById(queue_task.id);
    if (!structure || fillup >= structure.store.getFreeCapacity(RESOURCE_ENERGY)) {
        queue_task.priority = 0;
    } else {
        prioritize(queue_task, structure.structureType);
    }
}

function finish(creep, creep_task){
    let queue_task = tasks.findQueueTask(creep_task.name, creep_task.id);
    if (queue_task && queue_task.expected_fillup) {
        queue_task.expected_fillup -= creep_task.creep_exp_fillup;
        reprioritize(queue_task);
    }
}


var task = new tasks.Task("fill_structure", null);

task.state_array = [
    new tasks.State(tasks.takeFromStore),
    new tasks.State(tasks.fillStructure)
];

module.exports = {
    updateQueue: updateQueue,
    task: task,
    take: take,
    finish: finish,
};

