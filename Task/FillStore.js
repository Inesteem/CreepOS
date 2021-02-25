import {  QueueTask, CreepTask, findQueueTask, Task, State} from "./Task";
import { INFINITY, FILL_STORE_DEFAULT_PRIORITY, PRIORITY_LEVEL_STEP } from "../Constants";
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

/**
 * 
 * @param {Creep} creep 
 */
function harvest(creep) {

    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
        creep.say("full");
        return fillStore(creep);
    }

    creep.task.store_id = undefined;

    if (!creep.task.id){
        let sources = Game.find(FIND_SOURCES, {filter: (source) => !source.hasMiner()});
        if (sources.length) {
            let source = creep.pos.findClosestTarget(sources, 1, creep.getCostMatrix()).target;
            creep.task.id = source.id;
            source.reserveSource();
        } else {
            creep.say("found no source");
            return false;
        }
    }
    let source = Game.getObjectById(creep.task.id);

//    if (source.energy == 0) return true;

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
        return true;
    }
    creep.storeAt(target);
    if (creep.store[RESOURCE_ENERGY] == 0)
        return true;
    return true;
}

/**
 * 
 * @param {Creep} creep 
 * @param {{name: string, id: string}} creep_task 
 */
task.finish = (creep, creep_task) => {
    let source = /**@type {Source} */ (Game.getObjectById(creep_task.id));
    if (source)
        source.freeSource();
}

export { task };