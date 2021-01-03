var tasks = require("Task");
var log = require("Logging");
var constants = require("Constants");

function UpdateQueue() {
    let structures = [];
    let rooms = base.getOurRooms();
    
    rooms.forEach(room => {
       structures = structures.concat(room.find(FIND_MY_CONSTRUCTION_SITES));
    });
    structures.sort((a, b) => b.progress - a.progress);
    
    // Update the new task map.
    Memory.new_tasks.build = Memory.new_tasks.build || [];
    for (let structure of structures) {
        if (!Memory.new_tasks.build.find(build_task => build_task.id === structure.id)) {
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
    
    if (!structure) return;
    
    let add_energy = creep.store[RESOURCE_ENERGY] || creep.store.getCapacity();
    
    let projected_completion = add_energy / structure.progressTotal;
    
    if (!queue_task.projected_completion) {
        queue_task.projected_completion = projected_completion;
    } else {
        queue_task.projected_completion =
            projected_completion + queue_task.projected_completion;
    }
    
    reprioritize(queue_task);
    
    // Creates a new object that has queue_task as prototype.
    var F = function() {};
    F.prototype = queue_task;
    creep_task = new F();
    
    Object.assign(creep_task, tasks.getEnergyForTask(creep, creep_task).task);
}

function reprioritize(task_proxy) {
    let completion = task_proxy.projected_completion;
    if (completion >= 1) {
        task_proxy.priority = 0;
    } else {
        prioritize(task_proxy);
        task_proxy.priority += completion * constants.PRIORITY_LEVEL_STEP;
    }
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
};