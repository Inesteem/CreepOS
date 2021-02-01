import { QueueTask, CreepTask, State, takeFromStore, Task, findQueueTask } from "./Task";
import { info, error} from "../Logging";
import "../Game";
import { Frankencreep } from "../FrankenCreep";
import { REPAIR_DEFAULT_PRIORITY, REPAIR_PRIORITY, PRIORITY_LEVEL_STEP} from "../Constants";

/**
 * @constructor
 * @extends {Task} 
 */
function RepairTask(){
    this.state_array = [
        new State(takeFromStore),
        new State(repairStructure),
    ];
}
RepairTask.prototype = new Task("repair", null);
var task = new RepairTask();

function repairStructure(creep) {
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

task.updateQueue = () => {
    let structures = [];
    let rooms = Game.getOurRooms();
    
    rooms.forEach(room => {
       structures = structures.concat(room.find(FIND_STRUCTURES, {
            filter: object => object.hits && object.hits < object.hitsMax //&& object.structureType !== STRUCTURE_ROAD
        }));
    });

     Memory.new_tasks.repair = Memory.new_tasks.repair || [];
    for (let structure of structures) {
        if (!Memory.new_tasks.repair.find(repair_task => repair_task.id == structure.id)) {
            let queue_task = {id: structure.id, priority: 500, name:"repair"}
            prioritize(queue_task);
            Memory.new_tasks.repair.push(queue_task);
        }
    }
    for (let i = 0; i < Memory.new_tasks.repair.length; i++) {
        let repair_task = Memory.new_tasks.repair[i];
        let structure = Game.getObjectById(repair_task.id);
        if (!structure || structure.hits == structure.hitsMax) {
            Memory.new_tasks.repair.splice(i, 1);
            i--;
        }
    }
    info("Repair tasks: ", Memory.new_tasks.repair);
}

/**
 * Estimates the time for creep to finish queue_task.
 * @param {{store: Object, getActiveBodyparts : (function(number): number), pos : RoomPosition}} creep 
 * @param {QueueTask} queue_task 
 * @param {number=} max_cost
 * @return {number}
 */
task.estimateTime = function(creep, queue_task, max_cost) {
    let structure = /**@type {Structure} */ (Game.getObjectById(queue_task.id));
    if (!structure) return 0;
    if (creep.getActiveBodyparts(WORK) == 0) return Infinity;

    let to_repair = structure.hitsMax - structure.hits;

    let fatigue_decrease = creep.getActiveBodyparts(MOVE) * 2;
    let fatigue_base = creep.body.length - creep.getActiveBodyparts(MOVE);
    let path_costs = creep.pos.getPathCosts(structure.pos, 3, fatigue_base, fatigue_decrease, max_cost);
    
    let energy = Math.min(to_repair/100, creep.store[RESOURCE_ENERGY] || creep.store.getCapacity(RESOURCE_ENERGY));
    //let time_repairing = Math.min(to_repair/100, energy/creep.getActiveBodyparts(WORK));
    let time_repairing = energy/creep.getActiveBodyparts(WORK);

    return path_costs + time_repairing;
}

/**
 * @param {Creep} creep
 * @param {QueueTask} queue_task 
 * @return {?CreepTask}
 */
task.take = (creep, queue_task) => {
    let structure = Game.getObjectById(queue_task.id);
    
    if (!structure) return null;
    
    let add_hits = (creep.store[RESOURCE_ENERGY] || creep.store.getCapacity(RESOURCE_ENERGY)) * 100;
    
    queue_task.expected_hits = (queue_task.expected_hits || 0) + add_hits;
    
    reprioritize(queue_task);
    
    let creep_task = {};
    creep_task.creep_exp_hits = add_hits;
    
    //Object.assign(creep_task, getEnergyForTask(creep, queue_task).task);
    creep_task.id = queue_task.id;
    creep_task.name = queue_task.name;
    
    return creep_task;
}


/**
 * @param {QueueTask} queue_task 
 */
function prioritize(queue_task) {
    let structure = Game.getObjectById(queue_task.id);
    queue_task.priority = REPAIR_PRIORITY[structure.structureType];
    if (!queue_task.priority) {
        queue_task.priority = REPAIR_DEFAULT_PRIORITY;
    }
}

/**
 * Updates priority after the task was taken.
 * @param {QueueTask} queue_task 
 */
function reprioritize(queue_task) {
    let structure = Game.getObjectById(queue_task.id);
    if (!structure) {
        queue_task.priority = 0;
        return;
    }
    
    let expected_hits_total = structure.hits + (queue_task.expected_hits || 0);
    
    let completion = expected_hits_total / structure.hitsMax;

    if (completion >= 1) {
        queue_task.priority = 0;
    } else {
        prioritize(queue_task);
        queue_task.priority += (1-completion) * PRIORITY_LEVEL_STEP;
    }
}

/**
 * Finishes the task taken by take.
 * @param {Creep} creep 
 * @param {CreepTask} creep_task 
 */
task.finish = (creep, creep_task) => {
    let queue_task = findQueueTask(creep_task.name, creep_task.id);
    if (!queue_task) return;
    if (queue_task.expected_hits){ 
        queue_task.expected_hits -= creep_task.creep_exp_hits;
        reprioritize(queue_task);
    }
}

task.spawn = function(queue_task, room) {
    if (!room.allowSpawn()) return;

    let parts = [MOVE, CARRY, WORK];
    let body = [MOVE, CARRY, WORK];

    let newName = "Mario" + Game.time;
    let structure = Game.getObjectById(queue_task.id); //TODO: check if null
    let pos = structure.pos;
    let container = pos.findClosestStructure ((structure => {
        return structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE; 
    }));
    if (!container) {
        return room.spawnKevin();
    }

    let to_repair = (structure.hitsMax - structure.hits)/100;

    let best_eff = 0;
    while (room.spawnCreep(body, newName, { dryRun: true }) == 0) {
        let best_part = "none";
        for (let part of parts){
            body.push(part);
            let frankencreep = {pos : container.pos,
                body: body, 
                store : {energy: 0, getCapacity: (energy) => body.filter(x => x==CARRY).length * 50}, 
                getActiveBodyparts : (part) => body.filter(x => x==part).length};
            
            let carry = body.filter(x => x == CARRY).length * 50;
            let time = task.estimateTime(frankencreep, queue_task, carry/best_eff);
            if (time == null || time == Infinity) {
                body.pop();
                continue;
            }
            let eff = Math.min(to_repair,carry)/time;
            if(best_eff < eff){
                best_eff = eff;
                best_part = part;
            }
            body.pop();
        }
        if (best_part !== "none")
            body.push(best_part);
    }
    body.pop();
    if (body.length > 3 && (room.spawnCreep(body, newName, {}) == OK)) {
        return newName;
    }
    return "";
}

/**
 * @param {Creep} creep
 * @param {CreepTask} creep_task 
 * @return {Frankencreep}
 */
task.creepAfter = function(creep, creep_task) {
    let target = Game.getObjectById(creep_task.id);
    let freePositions = target.pos.getAdjacentGenerallyWalkables();
    if (freePositions.length == 0) {
        error (target, " is unreachable!");
        return null;
    }
    let frankencreep = new Frankencreep(freePositions[0], creep.body.map((part) => part.type), "Franky");
    let energy_start = creep.store[RESOURCE_ENERGY] || creep.store.getFreeCapacity(RESOURCE_ENERGY);
    let to_repair = target.hitsMax - target.hits;
    let use = Math.min(to_repair/100, creep.store[RESOURCE_ENERGY] || creep.store.getCapacity(RESOURCE_ENERGY));
    frankencreep.store[RESOURCE_ENERGY] = energy_start - use;
    return frankencreep;
}

export {task};