import {  QueueTask, CreepTask, Task, State, takeFromStore } from "./Task";
import { getUnclaimedFlags } from "./Base";
import { error } from "./Logging";

var task = new Task("claim_room", null);

task.state_array = [
    new State(goToRoom),
    new State(claimRoom),    
]

function goToRoom(creep) {
    if (!creep.memory.task.id) {
        const flags = getUnclaimedFlags();
        if (flags.length > 0) {
            creep.memory.task.id = flags[0].name;
        } else {
            return false;
        }
    }
    let flag = Game.flags[creep.memory.task.id];
    if (!flag) return false;
    if (flag.room === creep.room) {
        return false;
    }
    creep.moveToRoom(flag);
    return true;
}

/**
 * 
 * @param {Creep} creep 
 */
function claimRoom(creep) {
    let flag = /** @type Flag */ (Game.flags[creep.memory.task.id]);
    if (!flag) return false;
    
    if (flag.room !== creep.room) return false;

    if (!flag.room.controller) {
        creep.moveTo(flag.pos);
    } else if (flag.room.controller.my) {
        return false;
    } else {
        creep.claimRoom();
    }
    return true;
}

export {task};