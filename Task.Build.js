var tasks = require("Task");
var log = require("Logging");
var constants = require("Constants");
var base = require("Base");

function updateQueue() {
    let structures = [];
    let rooms = base.getOurRooms();
    
    rooms.forEach(room => {
       structures = structures.concat(room.find(FIND_MY_CONSTRUCTION_SITES));
    });
    structures.sort((a, b) => b.progress - a.progress);
    
    // Update the new task map.
    Memory.new_tasks.build = Memory.new_tasks.build || [];
    for (let structure of structures) {
        if (!tasks.findQueueTask("build", structure.id)) {
            let queue_task = {
                id: structure.id,
                name: "build"
            };
            prioritize(queue_task);
            Memory.new_tasks.build.push(queue_task);
        }
    }
    for (let i = 0; i < Memory.new_tasks.build.length; i++) {
        let queue_task = Memory.new_tasks.build[i];
        let structure = Game.getObjectById(queue_task.id);
        if (!structure) {
            log.info("Finished building task", queue_task);
            Memory.new_tasks.build.splice(i, 1);
            i--;
        }
    }
}

function prioritize(queue_task) {
    let structure = Game.getObjectById(queue_task.id);
    
    switch (structure.structureType) {
        case (STRUCTURE_ROAD):
            queue_task.priority = constants.BUILD_ROAD_PRIORITY;
            break;
        case (STRUCTURE_TOWER):
            queue_task.priority = constants.BUILD_TOWER_PRIORITY;
            break;
        case (STRUCTURE_EXTENSION):
            queue_task.priority = constants.BUILD_EXTENSION_PRIORITY;
            break;
        default:
            queue_task.priority = constants.BUILD_DEFAULT_PRIORITY;
    };
}

function take(creep, queue_task) {
    let structure = Game.getObjectById(queue_task.id);
    
    if (!structure) return null;
    
    let add_energy = creep.store[RESOURCE_ENERGY] || creep.store.getCapacity();
    
    queue_task.expected_progress = (queue_task.expected_progress || 0) + add_energy;
    
    reprioritize(queue_task);
    
    let creep_task = {};
    creep_task.creep_exp_progress = add_energy;
    
    Object.assign(creep_task, queue_task);
    Object.assign(creep_task, tasks.getEnergyForTask(creep, queue_task).task);
    
    return creep_task;
}

function reprioritize(queue_task) {
    let structure = Game.getObjectById(queue_task.id);
    if (!structure) {
        queue_task.priority = 0;
        return;
    }
    
    let expected_progress_total = structure.progress + (queue_task.expected_progress || 0);
    
    let completion = expected_progress_total / structure.progressTotal;
    if (completion >= 1) {
        queue_task.priority = 0;
    } else {
        prioritize(queue_task);
        queue_task.priority += completion * constants.PRIORITY_LEVEL_STEP;
    }
}

function finish(creep, creep_task) {
    let queue_task = tasks.findQueueTask(creep_task.name, creep_task.id);
    if (!queue_task) return;
    
    queue_task.expected_progress -= creep_task.creep_exp_progress;
    reprioritize(queue_task);
}

function BuildTask(){
    this.state_array = [
        new tasks.State(tasks.takeFromStore),
        new tasks.State(buildStructure),
    ];
}

function buildStructure(creep){
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

BuildTask.prototype = new tasks.Task("build", null);

var task = new BuildTask();

module.exports = {
    task: task,
    prioritize: prioritize,
    take: take,
    finish: finish,
    updateQueue: updateQueue,
};