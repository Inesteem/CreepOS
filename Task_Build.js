import { findQueueTask, getEnergyForTask, State, takeFromStore, Task } from "./Task";
import { info, error } from "./Logging";
import { BUILD_ROAD_PRIORITY, BUILD_TOWER_PRIORITY, BUILD_EXTENSION_PRIORITY, BUILD_DEFAULT_PRIORITY, PRIORITY_LEVEL_STEP } from "./Constants";
import { getOurRooms } from "./Base";


/**
 * @constructor 
 */
function BuildTask(){
    this.state_array = [
        new State(takeFromStore),
        new State(buildStructure),
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

BuildTask.prototype = new Task("build", null);

var task = new BuildTask();

task.updateQueue = () => {
    let structures = [];
    let rooms = getOurRooms();

    rooms.forEach(room => {
        structures = structures.concat(room.find(FIND_MY_CONSTRUCTION_SITES));
    });
    structures.sort((a, b) => b.progress - a.progress);

    // Update the new task map.
    Memory.new_tasks.build = Memory.new_tasks.build || [];
    for (let structure of structures) {
        if (!findQueueTask("build", structure.id)) {
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
            info("Finished building task", queue_task);
            Memory.new_tasks.build.splice(i, 1);
            i--;
        }
    }
}

function prioritize(queue_task) {
    let structure = Game.getObjectById(queue_task.id);
    
    switch (structure.structureType) {
        case (STRUCTURE_ROAD):
            queue_task.priority = BUILD_ROAD_PRIORITY;
            break;
        case (STRUCTURE_TOWER):
            queue_task.priority = BUILD_TOWER_PRIORITY;
            break;
        case (STRUCTURE_EXTENSION):
            queue_task.priority = BUILD_EXTENSION_PRIORITY;
            break;
        default:
            queue_task.priority = BUILD_DEFAULT_PRIORITY;
    };
}

task.take = (creep, queue_task) => {
    let structure = Game.getObjectById(queue_task.id);
    
    if (!structure) return null;
    
    let add_energy = creep.store[RESOURCE_ENERGY] || creep.store.getCapacity();
    
    queue_task.expected_progress = (queue_task.expected_progress || 0) + add_energy;
    
    reprioritize(queue_task);
    
    let creep_task = {};
    creep_task.creep_exp_progress = add_energy;
    
    Object.assign(creep_task, queue_task);
    Object.assign(creep_task, getEnergyForTask(creep, queue_task).task);
    
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
        queue_task.priority += completion * PRIORITY_LEVEL_STEP;
    }
}

task.finish = (creep, creep_task) => {
    let queue_task = findQueueTask(creep_task.name, creep_task.id);
    if (!queue_task) return;
    
    queue_task.expected_progress -= creep_task.creep_exp_progress;
    reprioritize(queue_task);
}

export {task};