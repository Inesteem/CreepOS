import { QueueTask, CreepTask, Task, State } from "./Task";
import { error } from "../Logging";
import { findEnemyCreeps as findEnemyCreeps } from "../Game";
import { getRoomsToClaim } from "../Base";
import "../Room";
import "../Game";
import "../RoomPosition";
import { Role } from "../Constants";

var task = new Task("kite", null);


/**
 * @param {Creep} creep
 * @return {boolean}
 */
function goToRoomWithSourceKeeper(creep) {
    if (!creep.memory.task.id){
        const roomsToClaim = getRoomsToClaim();
        for (let room of roomsToClaim) {
            
            let source_keeper_lairs = room.find(FIND_HOSTILE_STRUCTURES, {
                filter : {structureType: STRUCTURE_KEEPER_LAIR}
            });

            if (source_keeper_lairs.length > 0){
                let target = source_keeper_lairs[0];
                creep.memory.task.id = target.id;
                break;
            }
        }
    }
    if (!creep.memory.task.id)
        return false;
    
    let target = /**@type {Structure} */ (Game.getObjectById(creep.memory.task.id));
    if (!target) return false;
    
    if(target.room.name === creep.room.name) return false;
    creep.moveTo(target);    
    return true;
}

/**
 * @param {Creep} creep
 * @return {boolean}
 */
function attackTarget(creep) {
    
    if (!creep.memory.task.target_id){
        let source_keeper = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
            filter : creep => creep.owner.username === "Source Keeper"
        });

        if (!source_keeper) return false;
        
        creep.memory.task.target_id = source_keeper.id;
    }

    let target = Game.getObjectById(creep.memory.task.target_id);
    if (!target) return false;

    creep.fight(target);

    return true;
}

function getCreepBody() {
    return [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
            TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
            TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
            TOUGH,TOUGH,TOUGH,TOUGH,
            MOVE,MOVE,MOVE, MOVE, MOVE,
            MOVE,MOVE,MOVE, MOVE, MOVE,
            MOVE,MOVE,MOVE, MOVE, MOVE,
            MOVE,MOVE,MOVE, MOVE, MOVE,
            MOVE,
            ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,
            ATTACK,ATTACK];
}

task.state_array = [
    new State(goToRoomWithSourceKeeper),
    new State(attackTarget),
];


export { task, getCreepBody};
