import { Task, State } from "./Task";
import { error } from "../Logging";
import { getRoomsToClaim } from "../Base";
import "../GameObjects/Room";
import "../GameObjects/Game";
import "../GameObjects/RoomPosition";

const task = Object.create(new Task("attack_source_keeper"));
task.state_array = [
    new State(goToRoomWithSourceKeeper),
    new State(attackTarget),
];

/**
 * @param {Creep} creep
 * @return {boolean}
 */
function goToRoomWithSourceKeeper(creep) {
    if (!creep.task.id){
        const roomsToClaim = getRoomsToClaim();
        for (let room of roomsToClaim) {
            
            let source_keeper_lairs = room.find(FIND_HOSTILE_STRUCTURES, {
                filter : {structureType: STRUCTURE_KEEPER_LAIR}
            });

            if (source_keeper_lairs.length > 0){
                let target = source_keeper_lairs[0];
                creep.task.id = target.id;
                break;
            }
        }
    }
    if (!creep.task.id)
        return false;
    
    let target = /**@type {Structure} */ (Game.getObjectById(creep.task.id));
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
    
    if (!creep.task.target_id){
        let source_keeper = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
            filter : creep => creep.owner.username === "Source Keeper"
        });

        if (!source_keeper) return false;
        
        creep.task.target_id = source_keeper.id;
    }

    let target = Game.getObjectById(creep.task.target_id);
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


export { task, getCreepBody};
