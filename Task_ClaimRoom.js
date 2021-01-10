import {  QueueTask, CreepTask, Task, State, takeFromStore } from "./Task";
import { getUnclaimedFlags } from "./Base";
import { error } from "./Logging";

var task = new Task("claim_room", null);

task.state_array = [
    new State(claimRoom),    
]

/**
 * 
 * @param {Creep} creep 
 */
function claimRoom(creep) {
    const flags = getUnclaimedFlags();
    if (flags.length > 0) {
        creep.moveToRoom(flags[0]);
    } else {
        creep.claimRoom();
    }
    
    return true;
}

export {task};