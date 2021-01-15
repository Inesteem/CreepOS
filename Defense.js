import { getOurRooms, getRoomsToClaim} from "./Base";
import { Role } from "./Constants";
import { spawnArcherInRoom } from "./SpawnMachine";
import { findEnemyCreeps as findEnemyCreeps } from "./Game";
import "./Room";
import "./RoomPosition";

// Detects whether safe mode needs to be activated in any of our rooms and activates it.
// If a room has enemies but no safe mode, spawns defenders.
function monitor() {
    let rooms = getOurRooms();
    let enemies = findEnemyCreeps(rooms, (creep) => true).all;
    const roomsToClaim = getRoomsToClaim();
    const enemiesClaimed = findEnemyCreeps(roomsToClaim, (creep) => true).all;
    enemies = enemies.concat(enemiesClaimed);
    rooms= rooms.concat(enemiesClaimed);

    for (let enemy of enemies) {
        let room = enemy.room;
        let num_archers = room.numCreeps( (creep) => creep.memory.role == Role.ARCHER);
        if (!room.controller.safeMode
                && !room.controller.safeModeCooldown
                && room.controller.safeModeAvailable) {
            room.controller.activateSafeMode();
            if (num_archers < 2) {
                spawnArcherInRoom(room);
                return;
            }
        }
        else if (!room.controller.safeMode && num_archers < 5) {
            spawnArcherInRoom(room);
            return;
        }
    }
    //check for hostile creeps / structures in claimed rooms
    let room = Game.spawns["Spawn1"].room;
    let num_archers = room.numCreeps( (creep) => creep.memory.role == Role.ARCHER);
    if (num_archers < 2) {
        for (let roomC of roomsToClaim) {
            if (roomC.getHostileStructures().length > 0 || roomC.findAllHostileCreeps().all) {
                spawnArcherInRoom(room);
                return;
            }
        }
    }
}
/*
function kite(creep){
    const rooms = getOurRooms();
    const enemies = findEnemyCreeps(rooms, (creep) => true).all;
    let target = creep.pos.findClosestByRange(enemies);
    
    if (!target) {
        target = creep.pos.findClosestTarget(enemies,1000,5);
    }
    if(!target) {
        const roomsToClaim = getRoomsToClaim();
        //TODO: stirbt wenn es mehr als einen Raum mit hstructures gibt weil sie dann immer sich random umentscheiden
        for (let room of roomsToClaim){
            
            let hostile_structures = room.getHostileStructures();
            if (hostile_structures.length>0) {
                target = hostile_structures[1];
                break;
            }//TODO:enemies
        }
    }
    
    if(!target) return false;
    
    if (!target.room.controller.safeMode && creep.pos.inRangeTo(target.pos, 2) 
                    && target.getActiveBodyparts(ATTACK)) {
        creep.moveAwayFrom(target, 3);
    } else {
        creep.shoot(target);
    }
}
*/
export {monitor};
    
