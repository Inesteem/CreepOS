import {  QueueTask, CreepTask, findQueueTask, Task, State} from "./Task";
import { FILL_STORE_DEFAULT_PRIORITY, PRIORITY_LEVEL_STEP } from "../Constants";
import "../RoomPosition";
import "../Source";
import "../Game";
import { error } from "../Logging";
import { Frankencreep } from "../FrankenCreep";

/**
 * 
 * @param {Creep} creep 
 */
function harvest(creep) {
    creep.memory.task.store_id = undefined;

    if (!creep.memory.task.id){
        creep.say("no task id");
        return false;
    }
    creep.say(creep.memory.task.id);
    let source = Game.getObjectById(creep.memory.task.id);

//    if (source.energy == 0) return true;

    if (!source){
        creep.say("source empty");
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
        creep.memory.task.store_id = undefined;
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
    let rooms = Game.getOurRooms();
    
    // SPAWN
    
    rooms.forEach(room => {
       sources = sources.concat(room.find(FIND_SOURCES));
    });
    
    // Update the new task map
    Memory.new_tasks.fill_store = Memory.new_tasks.fill_store || [];
    for (let source of sources) {
        if (source.room.find(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_CONTAINER}}).length == 0){
            continue;
        }
        if (!Memory.new_tasks.fill_store.find
                (fill_task => fill_task.id === source.id)) {
            let queue_task = {id: source.id || "", name:"fill_store", priority: 0, num_creeps : 0};
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
        if (source.room.find(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_CONTAINER}}).length == 0){
            Memory.new_tasks.fill_store.splice(i, 1);
            i--;
        }
        //else if (Game.time%3000 == 0) {
            // Delete task every 3000 ticks to avoid it getting stuck in a false state.
       //     Memory.new_tasks.fill_store.splice(i, 1);
       //     i--;
       //  }
    }
}

/**
 * @param {QueueTask} queue_task 
 */
function prioritize(queue_task) {
    let source = Game.getObjectById(queue_task.id);
    if (!source) return;
    let fullness =  source.room.getFreeCapacity(RESOURCE_ENERGY)/(source.room.getFreeCapacity(RESOURCE_ENERGY) + source.room.storedEnergy());
    queue_task.priority = FILL_STORE_DEFAULT_PRIORITY + fullness * PRIORITY_LEVEL_STEP;
    //error(source.room.getFreeCapacity(RESOURCE_ENERGY) , " ",  source.room.storedEnergy(), " ", fullness, " ",  queue_task.priority);
}
/**
 * @param {Creep} creep
 * @param {QueueTask} queue_task 
 * @return {CreepTask|null}
 */
task.take = (creep, queue_task) => {
    queue_task.priority = 0;
    queue_task.num_creeps = queue_task.num_creeps || 0;
    queue_task.num_creeps += 1;
    let creep_task = {};

    creep_task.id = queue_task.id;
    creep_task.name = queue_task.name;
    
    let source = /**@type {Source} */ (Game.getObjectById(creep_task.id));
    source.reserveSource();

    return creep_task;
}

/**
 * 
 * @param {Creep} creep 
 * @param {{name: string, id: string}} creep_task 
 */
task.finish = (creep, creep_task) => {
    let queue_task = findQueueTask(creep_task.name, creep_task.id);
    
    if (queue_task){ 
        queue_task.num_creeps -= 1;
        if (queue_task.num_creeps <= 0) {
            queue_task.num_creeps = 0;
            prioritize(queue_task);       
        }
    }
    let source = /**@type {Source} */ (Game.getObjectById(creep_task.id));
    if (source)
        source.freeSource();

    if (Game.creeps[creep.name])
        creep.say("finishing");
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

/**
 * @param {Creep} creep
 * @param {CreepTask} creep_task 
 * @return {Frankencreep}
 */
task.creepAfter = function(creep, creep_task) {
    return null;
}

task.spawn = function(queue_task, room) {
    return room.spawnMiner();
}

export { task };