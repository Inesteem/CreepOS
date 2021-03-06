import {  QueueTask, CreepTask, findQueueTask, Task, State} from "./Task";
import { Role } from "../Constants";
import "../GameObjects/RoomPosition";
import "../GameObjects/Source";
import "../GameObjects/Game";
import { error } from "../Logging";
import { Frankencreep } from "../FrankenCreep";

const task = Object.create(new Task("fill_store"));
task.state_array = [
    new State(harvest),
    new State(fillStore),
]

task.role = Role.MINER;

/**
 * 
 * @param {Creep} creep 
 */
function harvest(creep) {
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) return false;

    if (!creep.task.id){
        if (!creep.memory.source) {
            let sources = Game.find(FIND_SOURCES, {filter: (source) => !source.hasMiner()});
            if (sources.length) {
                let source = /** @type {Source} */ (creep.pos.findClosestTarget(sources, 1, creep.getCostMatrix()).target);
                creep.memory.source = source.id;
                source.memory.miner = creep.name;
            } else {
                creep.say("found no source");
                return false;
            }
        }
        creep.task.id = creep.memory.source;
    }
    let source = Game.getObjectById(creep.task.id);

    if (!source){
        creep.say("source empty");
        return false;
    }

    if (!creep.harvestFrom(source)) {
        if (!source.hasFreeSpot()) {
            creep.say("no spot");
        }
    }
    
    return true;
};

/**
 * 
 * @param {Creep} creep 
 */
function fillStore(creep) {
    let target = null;
    if (!creep.task.store_id) {
        target = creep.pos.findClosestStructure((s) => {
            return (s.structureType === STRUCTURE_STORAGE || s.structureType === STRUCTURE_CONTAINER ) &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) >= creep.store[RESOURCE_ENERGY];
        });
        
        if (target) {
            creep.task.store_id = target.id;
        }
    } else {
        target = Game.getObjectById(creep.task.store_id);
    }

    if (!target || target.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
        creep.task.store_id = undefined;
        return false;
    }
    creep.storeAt(target);
    if (creep.store[RESOURCE_ENERGY] == 0)
        return false;
    return true;
}

/**
 * @this {Task}
 */
task.checkSpawn = function() {
    let free_sources = Game.find(FIND_SOURCES).filter(source => !source.hasMiner());
    for (let source of free_sources) {
        let spawn = source.pos.findClosestByPath(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_SPAWN}});
        if (spawn) {
            this.spawn(spawn);
        }
    } 
}

task.spawn = function(spawn) {
    var newName = "Lars" + Game.time;

    var parts = [WORK];
    var body = [WORK, CARRY, MOVE, WORK, WORK];
    var idx = 0;

    while (spawn.spawnCreep(body, newName, { dryRun: true }) == 0) {
        body.push(parts[idx]);
        idx = (idx + 1) % parts.length;
        if (body.length > 9) break;
    }
    
    body.pop();

    if ((body.length == 9 || spawn.allowSpawn())) {
        return spawn.spawnCreep(body, newName, {memory: {role: Role.MINER}});
    }
    return ERR_NOT_ENOUGH_ENERGY;
}

export { task };