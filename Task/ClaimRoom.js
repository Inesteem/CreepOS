import { Task, State } from "./Task";
import { getUnclaimedFlags } from "../Base";
import { error } from "../Logging";

const task = Object.create(new Task("claim_room"));
task.state_array = [
    new State(goToRoom),
    new State(claimRoom),    
]

function goToRoom(creep) {
    if (!creep.task.id) {
        const flags = getUnclaimedFlags();
        if (flags.length > 0) {
            creep.task.id = flags[0].name;
        } else {
            return false;
        }
    }
    let flag = Game.flags[creep.task.id];
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
    let flag = /** @type Flag */ (Game.flags[creep.task.id]);
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