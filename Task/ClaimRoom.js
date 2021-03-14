import { Task, State } from "./Task";
import { getUnclaimedFlags } from "../Base";
import { error } from "../Logging";
import { Role } from "../Constants";
import "../GameObjects/Game";

const task = Object.create(new Task("claim_room"));
task.state_array = [
    new State(goToRoom),
    new State(claimRoom),    
]

task.role = Role.SCOUT;

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

/**
 * @this {Task}
 */
task.checkSpawn = function() {
    const scout_num = Game.numCreeps((creep) => creep.memory.role == Role.SCOUT);
    const flags = Game.findUnclaimedFlags();
    if (scout_num == 0 && flags.length > 0) {
        const flag = flags[0];
        const spawn = flag.pos.findClosestSpawn();
        if (spawn) {
            spawnScout(spawn)
        }
    }
}

/**
 * @param {StructureSpawn} spawn 
 */
function spawnScout(spawn) {
    var newName = "Scouty" + Game.time;

    var body = [CLAIM, MOVE, MOVE];

    if (body.length >= 2)
        return spawn.spawnCreep(body, newName, { memory: { role: Role.SCOUT } });
    return ERR_NOT_ENOUGH_ENERGY;
}

export {task};