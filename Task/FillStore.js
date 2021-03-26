import {  QueueTask, CreepTask, findQueueTask, Task, State} from "./Task";
import { NOT_APPLICAPLE, Role } from "../Constants";
import "../GameObjects/RoomPosition";
import "../GameObjects/Source";
import "../GameObjects/Game";
import { error } from "../Logging";
import { Frankencreep } from "../FrankenCreep";

const task = Object.create(new Task("fill_store"));
task.state_array = [
    new State(harvest),
    new State(buildOrFillStore),
    new State(collectDroppedEnergy),
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
function buildOrFillStore(creep) {
    if (!creep.task.store_id && !creep.task.future_store_id) {
        if (maybePlaceConstructionSite(creep) === OK) return true;
        let target = creep.pos.findClosestStructure((s) => {
            return (s.structureType === STRUCTURE_STORAGE || s.structureType === STRUCTURE_CONTAINER ) &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) >= creep.store[RESOURCE_ENERGY];
        });
        let future_target =  creep.pos.findClosestObject(FIND_CONSTRUCTION_SITES, (cs) => {
            return (cs.structureType === STRUCTURE_CONTAINER ); 
        });
        if (target) {
            if(future_target && (creep.pos.roomName != target.pos.roomName || creep.pos.getRangeTo(future_target) < creep.pos.getRangeTo(target))) {
                creep.task.future_store_id = future_target.id;
            } else { 
                creep.task.store_id = target.id;
            }
        } else if (future_target) {
            creep.task.future_store_id = future_target.id;
        }
    }

    if(creep.task.future_store_id)
        return buildStore(creep);

    if(creep.task.store_id)
        return fillStore(creep);

    return false;        
}

function maybePlaceConstructionSite(creep) {
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0 && creep.pos.findAdjacent(LOOK_SOURCES).length > 0) {
        let container = creep.pos.findAdjacent(LOOK_STRUCTURES, (obj) => 
                obj.structure.structureType === STRUCTURE_CONTAINER &&
                obj.structure.store.getFreeCapacity(RESOURCE_ENERGY) >= creep.store[RESOURCE_ENERGY]);
        let construction_site = creep.pos.findAdjacent(LOOK_CONSTRUCTION_SITES, (obj) => {
            return /** @type {{constructionSite: ConstructionSite}} */ (obj).constructionSite.structureType === STRUCTURE_CONTAINER;
        });

        if (!container.length && !construction_site.length) {
            let positions = creep.pos.getAdjacentGenerallyWalkables();
            positions.unshift(creep.pos);
            for (let pos of positions) {
                if (creep.room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER) === OK)
                    return OK;
            }
        }
    }
    return NOT_APPLICAPLE;
}

/**
 * Fillz tze store
 * @param {Creep} creep 
 */
function fillStore(creep) {
    let target = /**@type {Structure} */ (Game.getObjectById(creep.task.store_id));

    if (!target || target.store.getFreeCapacity(RESOURCE_ENERGY) == 0) 
        return false;
    
    creep.storeAt(target);
    
    if (creep.store[RESOURCE_ENERGY] == 0)
        return false;
   
    return true;
}
/**
 * Buildz tze store
 * @param {Creep} creep 
 */
function buildStore(creep) {
    let target = /**@type {ConstructionSite} */(Game.getObjectById(creep.task.future_store_id));

    if (!target) 
        return false;
    
    creep.build(target);
    creep.say("build ");
    
    if (creep.store[RESOURCE_ENERGY] == 0)
        return false;
    
    return true;
}
/**
 * 
 * @param {Creep} creep 
 */
function collectDroppedEnergy(creep){
    let dropped_energy = creep.pos.findAdjacent(LOOK_RESOURCES, 
            (obj => /** @type {{resource: Resource}} */ (obj).resource.resourceType === RESOURCE_ENERGY));
    if(dropped_energy.length === 0 || creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) return false;
    creep.collectDroppedResource(dropped_energy[0].resource); 
    creep.say(dropped_energy[0].resource.amount);
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