import {  QueueTask, CreepTask, getEnergyForTask, findQueueTask, Task, State, takeFromStore, fillStructure } from "./Task";
import { getOurRooms } from "./Base";;
import { FILL_SPAWN_PRIORITY, FILL_EXTENSION_PRIORITY, FILL_TOWER_PRIORITY, FILL_DEFAULT_PRIORITY, FILL_STORE_DEFAULT_PRIORITY } from "./Constants";
import "./RoomPosition";
import "./Source";
import { error } from "./Logging";

/**
 * 
 * @param {Creep} creep 
 */
function harvest(creep) {
    creep.say("harvest");
    if (!creep.memory.task.id){
        creep.say("no task id");
        return false;
    }
    let source = Game.getObjectById(creep.memory.task.id);

    if (source.energy == 0) return true;

    if (!source){
        creep.say("no source or source has no energy");
        return false;
    }

    if (!creep.harvestFrom(source)) {
        if (!source.hasFreeSpot()) {
            creep.say("no spot");
            return false;
        }
    }
    
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
        creep.say("full");
        return false;
    }
    return true;
};

/**
 * 
 * @param {Creep} creep 
 */
function fillStore(creep) {
    creep.say("fill store");
    let target = null;
    if (!creep.memory.task.store_id) {
        target = creep.pos.findClosestStructure((s) => {
            return (s.structureType === STRUCTURE_STORAGE || s.structureType === STRUCTURE_CONTAINER ) &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) >= creep.store[RESOURCE_ENERGY];
        });
        
        if (target) {
            creep.memory.task.store_id = target.id;
        }
    } else {
        target = Game.getObjectById(creep.memory.task.store_id);
    }

    if (!target || target.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
        return false;
    }
    creep.storeAt(target);
    if (creep.store[RESOURCE_ENERGY] == 0)
        return false;
    return true;
}

var task = new Task("fill_store", null);

task.state_array = [
    new State(harvest),
    new State(fillStore),
]

task.updateQueue = () => {
    let sources = [];
    let rooms = getOurRooms();
    
    // SPAWN
    
    rooms.forEach(room => {
       sources = sources.concat(room.find(FIND_SOURCES));
    });
    
    // Update the new task map
    Memory.new_tasks.fill_store = Memory.new_tasks.fill_store || [];
    for (let source of sources) {
        if (!Memory.new_tasks.fill_store.find
                (fill_task => fill_task.id === source.id)) {
            let queue_task = {id: source.id || "", name:"fill_store", priority: 0};
            prioritize(queue_task);
            Memory.new_tasks.fill_store.push(queue_task);
        }
    }
    
    // DELETION
    for (let i = 0; i < Memory.new_tasks.fill_store.length; i++) {
        let fill_task = Memory.new_tasks.fill_store[i];
        let source = Game.getObjectById(fill_task.id);
        if (!source) {
            Memory.new_tasks.fill_store.splice(i, 1);
            i--;
        }
    }
}

/**
 * @param {QueueTask} queue_task 
 */
function prioritize(queue_task) {
    queue_task.priority = FILL_STORE_DEFAULT_PRIORITY;
}
/**
 * @param {Creep} creep
 * @param {QueueTask} queue_task 
 * @return {CreepTask|null}
 */
task.take = (creep, queue_task) => {
    queue_task.priority = 0;
    
    let creep_task = {};

    creep_task.id = queue_task.id;
    creep_task.name = queue_task.name;
    
    return creep_task;
}

/**
 * 
 * @param {Creep} creep 
 * @param {{name: string, id: string}} creep_task 
 */
task.finish = (creep, creep_task) => {
    let queue_task = findQueueTask(creep_task.name, creep_task.id);
    if (queue_task) prioritize(queue_task);
}

/**
 * Estimates the time for creep to finish queue_task.
 * @param {Creep} creep 
 * @param {QueueTask} queue_task 
 * @param {number=} max_cost
 * @return {number}
 */
task.estimateTime = function(creep, queue_task, max_cost) {
    let source = Game.getObjectById(queue_task.id);
    if (!source) return 0;

    if (!creep.getActiveBodyparts(WORK)) return Infinity;

    let energy = Math.min(source.energy, creep.store.getCapacity(RESOURCE_ENERGY));
    let mine_time = energy/(2 * creep.getActiveBodyparts(WORK));

    let fatigue_decrease = creep.getActiveBodyparts(MOVE) * 2;
    let fatigue_base = creep.body.length - creep.getActiveBodyparts(MOVE);
    let path_costs = creep.pos.getPathCosts(source.pos, 1, fatigue_base, fatigue_decrease, max_cost);

    return mine_time + path_costs;
}

task.spawn = function(queue_task, room) {
    room.spawnMiner();
}

export { task };