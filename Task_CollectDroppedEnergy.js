import {  QueueTask, CreepTask, Task, State, fillStore, findQueueTask } from "./Task";
var task = new Task("collect_dropped_energy", null);
import { getOurRooms } from "./Base";
import { error } from "./Logging";

task.updateQueue = () => {
    let rooms = getOurRooms();
    let dropped_energy = [];
    
    rooms.forEach(room => {
        dropped_energy = dropped_energy.concat(room.find(FIND_DROPPED_RESOURCES, {
                filter: 
                /** @param {Resource} d */
                (d) => {
                    return d.amount >= 50 && d.resourceType == RESOURCE_ENERGY;
                }
            }));
    });
    
    Memory.new_tasks.collect_dropped_energy = Memory.new_tasks.collect_dropped_energy || [];
    for (let drop of dropped_energy) {
        if (!Memory.new_tasks.collect_dropped_energy.find(drop_task => drop_task.id === drop.id)) {
            let queue_task = {id: drop.id, priority: 2500, name:"collect_dropped_energy"};
            Memory.new_tasks.collect_dropped_energy.push(queue_task);
        }
    }
    
    for (let i = 0; i < Memory.new_tasks.collect_dropped_energy.length; i++) {
        let queue_task = Memory.new_tasks.collect_dropped_energy[i];
        let resource = Game.getObjectById(queue_task.id);
        if (!resource) {
            Memory.new_tasks.collect_dropped_energy.splice(i, 1);
            i--;
        }
    }
}


function collectDroppedEnergy(creep) {
    let resource = Game.getObjectById(creep.memory.task.id);
    if (!resource) {
        return false;
    }
    if(resource.amount > 0 && creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0){
        creep.collectDroppedResource(resource);
        return true;
    } else {
        return false;
    }
}

function reprioritize(queue_task) {
    let resource = Game.getObjectById(queue_task.id);
    if (!resource) return null;

    let left = resource.amount - queue_task.expected_take;
    if (left > 50) {
        queue_task.priority = 2500;
    } else {
        queue_task.priority = 0;
    }
}

/**
 * @param {Creep} creep
 * @param {QueueTask} queue_task 
 * @return {?CreepTask}
 */
task.take = (creep, queue_task) => {
    if (!queue_task) return null;
    
    let resource = Game.getObjectById(queue_task.id);
    if (!resource) return null;

    let expected_take = Math.min(resource.amount, creep.store.getFreeCapacity(RESOURCE_ENERGY));
    
    queue_task.expected_take = (queue_task.expected_take || 0) + expected_take;
    
    reprioritize(queue_task);
    
    let creep_task = {};
    
    creep_task.creep_expected_take = expected_take;
    creep_task.id = queue_task.id;
    creep_task.name = queue_task.name;
    
    return creep_task;
}

/**
 * @param {Creep} creep 
 * @param {CreepTask} creep_task 
 */
task.finish = (creep, creep_task) =>{
    let queue_task = findQueueTask("collect_dropped_energy", creep_task.id);
    
    if (!queue_task) return;

    if (queue_task.expected_take && creep_task.creep_expected_take)
        queue_task.expected_take -= creep_task.creep_expected_take;
    
    reprioritize(queue_task);
}

/**
 * Check if creep is suitbale for task
 * @param {Creep} creep 
 * @param {QueueTask} queue_task
 * @return boolean 
 */
task.isSuitable = (creep, queue_task) => {
     let suitability = creep.store.getFreeCapacity(RESOURCE_ENERGY) >= 50;
     //log.error(creep.name + " isSuitable for "+ queue_task.name + ": " + suitability);
     return suitability;
 
 }
 

task.state_array = [
    new State(collectDroppedEnergy),
];

export {task};