import { QueueTask, CreepTask, Task, State } from "./Task";
import { error } from "./Logging";
import { findEnemyCreeps as findEnemyCreeps } from "./Game";
import { getOurRooms, getRoomsToClaim } from "./Base";
import "./Room";
import "./RoomPosition";
import { Role } from "./Constants";

var task = new Task("kite", null);

/**
 * @param {Creep} creep
 * @return {boolean}
 */
function getTarget(creep) {
    const rooms = getOurRooms();
    const enemies = findEnemyCreeps(rooms, (creep) => true).all;
    const roomsToClaim = getRoomsToClaim();
    const enemiesClaimed = findEnemyCreeps(roomsToClaim, (creep) => true).all;

    let target = creep.pos.findClosestByRange(enemies);
    
    //hostile creeps in own rooms
    if (!target) {
        target = creep.pos.findClosestTarget(enemies,3,1000,5);
    }
    
    //TODO: hostile structures in own rooms
    
    //hostile creeps in claimed rooms
    // if (!target) {
    //     target = creep.pos.findClosestTarget(enemiesClaimed,3,1000,5);
    // }

    // //hostile structures in rooms to claim
    // if(!target) {
    //     const roomsToClaim = getRoomsToClaim();
    //     error(roomsToClaim);
    //     for (let room of roomsToClaim){
            
    //         let hostile_structures = room.getHostileStructures();
    //         error(room + " " + hostile_structures);
    //         if (hostile_structures.length>0) {
    //             target = hostile_structures[1];
    //             break;
    //         }
    //     }
    // }
    
    if(!target) return false;

    creep.memory.task.id = target.id;
    return false;

}

/**
 * @param {Creep} creep
 * @return {boolean}
 */
function kiteTask(creep) {
    let target = creep.memory.task.id && Game.getObjectById(creep.memory.task.id);

    if (!target) {
        
        let flags = Object.values(Game.flags);
        let nearest_flag = creep.pos.findClosestByRange(flags);
        if (nearest_flag && !creep.pos.inRangeTo(nearest_flag, 5)) {
            creep.moveTo(nearest_flag);
        }
        return true;
    }

    if ((!target.room.controller || !target.room.controller.safeMode) && creep.pos.inRangeTo(target.pos, 2)
        && target.getActiveBodyparts(ATTACK)) { // TODO: is creep
        creep.moveAwayFrom(target, 3);
    } else {
        creep.shoot(target);
    }

    return true;
}





/**
 * @param {Creep} creep
 * @param {QueueTask} queue_task 
 * @return {CreepTask}
 */
task.take = function (creep, queue_task) {
    if (queue_task.priority >= 1000) {
        queue_task.priority -= 500;
    }
    let target = creep.memory.task.id && Game.getObjectById(creep.memory.task.id);
    let creep_task = {};
    if (target) creep_task.id = target.id;
    creep_task.id = queue_task.id;
    creep_task.name = queue_task.name;

    return creep_task;
}


/**
 * Check if creep is suitbale for task
 * @param {Creep} creep 
 * @param {QueueTask} queue_task
 * @return {boolean}
 */
task.isSuitable = (creep, queue_task) => {
    let suitability = creep.memory.role === Role.ARCHER;
    //log.error(creep.name + " isSuitable for "+ queue_task.name + ": " + suitability);
    return suitability;

}

task.state_array = [
    new State(getTarget),
    new State(kiteTask),
];


export { task};
