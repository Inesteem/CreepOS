import {  QueueTask, CreepTask, State, takeFromStore, Task } from "./Task";
import { info, error} from "./Logging";
import { getOurRooms } from "./Base";


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
    let rooms = getOurRooms();
    
    rooms.forEach(room => {
       structures = structures.concat(room.find(FIND_STRUCTURES, {
            filter: object => object.hits && object.hits < object.hitsMax //&& object.structureType !== STRUCTURE_ROAD
        }));
    });

     Memory.new_tasks.repair = Memory.new_tasks.repair || [];
    for (let structure of structures) {
        if (!Memory.new_tasks.repair.find(repair_task => repair_task.id == structure.id)) {
            Memory.new_tasks.repair.push({id: structure.id, priority: 500, name:"repair"});
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
        room.spawnKevin();
        return;
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
    if (body.length > 3)
        return (room.spawnCreep(body, newName, {}));
}


export {task};