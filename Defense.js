import { getOurRooms} from "./Base";
import { Role } from "./Constants";
import { spawnArcher } from "./SpawnMachine";
import { findEnemyCreeps as findEnemyCreeps } from "./Game";
import "./Room";

// Detects whether safe mode needs to be activated in any of our rooms and activates it.
// If a room has enemies but no safe mode, spawns defenders.
function monitor() {
    const rooms = getOurRooms();
    const enemies = findEnemyCreeps(rooms, (creep) => true);
    for (let enemy of enemies.all) {
        let room = enemy.room;
        let num_archers = room.numCreeps( (creep) => creep.memory.role == Role.ARCHER);
        if (!room.controller.safeMode
                && !room.controller.safeModeCooldown
                && room.controller.safeModeAvailable) {
            room.controller.activateSafeMode();
            if (num_archers < 2) {
                spawnArcher();
            }
        }
        else if (!room.controller.safeMode && num_archers < 5) {
            spawnArcher();
        }
    }
}
    
var kite = function(creep){
    const rooms = getOurRooms();
    const enemies = findEnemyCreeps(rooms, (creep) => true).all;
    
    const target = creep.pos.findClosestByRange(enemies);
    if (!target) return false;
    if (!target.room.controller.safeMode && creep.pos.inRangeTo(target.pos, 2) 
                    && target.getActiveBodyparts(ATTACK)) {
        creep.moveAwayFrom(target, 3);
    } else {
        creep.shoot(target);
    }
    
    return true;
};

export { kite, monitor };