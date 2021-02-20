import { QueueTask, CreepTask, findQueueTask, Task, State, takeFromStore, fillStructure } from "./Task";
import { INFINITY, REDISTRIBUTE_DEFAULT_PRIORITY, Role } from "../Constants";
import { error } from "../Logging";
import { Frankencreep } from "../FrankenCreep";
import "../GameObjects/RoomPosition";
import "../GameObjects/Game";

const task = Object.create(new Task("redistribute"));
task.state_array = [
    new State(takeFromStore),
    new State(fillStructure)
];

/**
 * 
 * @param {RoomPosition} pos 
 * @return {StructureContainer}
 */
function findBestAvailableContainer(pos){
    let container  = /** @type {StructureContainer} */ (pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (structure) => {
                return (structure.structureType === STRUCTURE_CONTAINER) &&
                    structure.store[RESOURCE_ENERGY] > 
                    0.5 * structure.store.getCapacity(RESOURCE_ENERGY);
        }
    }));
    return container;

}

/**
 * @this {{queue: Array<QueueTask>, name: string}}
 */
task.updateQueue = function() {
    let self = (this);
    let storages = [];
    let rooms = Game.getOurRooms();

    rooms.forEach(room => {
        storages = storages.concat(room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) >= 500;
                }
        }));
    });
    
    // DELETION
    for (let i = 0; i < self.queue.length; i++) {
        let task = self.queue[i];
        let structure = Game.getObjectById(task.id);
        let container = findBestAvailableContainer(structure.pos);
        if (!container || !structure || structure.store.getFreeCapacity(RESOURCE_ENERGY) < 500) {
            self.queue.splice(i, 1);
            i--;
        }
    }
    for (let storage of storages) {
        if(!findBestAvailableContainer(storage.pos)) continue;
        if (!self.queue.find
                (task => task.id === storage.id)) {
            let queue_task = {id: storage.id || "", name: self.name, priority: 0};
            prioritize(queue_task, storage.structureType);
            self.queue.push(queue_task);
        }
    }
    
}

/**
 * @param {QueueTask} queue_task 
 * @param {string} structure_type 
 */
function prioritize(queue_task, structure_type) {
    queue_task.priority = REDISTRIBUTE_DEFAULT_PRIORITY;
}

/**
 * @param {Creep} creep
 * @param {QueueTask} queue_task 
 * @return {CreepTask|null}
 */
task.take = (creep, queue_task) => {
    let structure = /** @type {StructureStorage} */ (Game.getObjectById(queue_task.id));
    
    if (!structure) return null;
    

    let container  = findBestAvailableContainer(structure.pos); 
    if (!container) return null;

    let add_energy = Math.min(container.store[RESOURCE_ENERGY],creep.store.getCapacity(RESOURCE_ENERGY));
    if (!queue_task.expected_fillup) {
        queue_task.expected_fillup = add_energy;  
    } else {
        queue_task.expected_fillup += add_energy;
    }
    
    reprioritize(queue_task);
    
    let creep_task = {};
    
    creep_task.creep_exp_fill = add_energy;
     

    creep_task.store_id = container.id;
    creep_task.id = queue_task.id;
    creep_task.name = queue_task.name;
    
    //error("redistribute from ", creep_task.store_id, " (", container.pos, ") to ", creep_task.id, " (", Game.getObjectById(creep_task.id).pos, ")"  );

    return creep_task;
}

function reprioritize(queue_task) {
    if (!queue_task.expected_fillup) queue_task.expected_fillup = 0;
    let fillup = queue_task.expected_fillup;
    let structure = Game.getObjectById(queue_task.id);
    if (!structure || fillup >= structure.store.getFreeCapacity(RESOURCE_ENERGY)) {
        queue_task.priority = 0;
    } else {
        prioritize(queue_task, structure.structureType);
    }
}

/**
 * 
 * @param {Creep} creep 
 * @param {{name: string, id: string, creep_exp_fillup: number}} creep_task 
 */
task.finish = (creep, creep_task) => {
    let queue_task = findQueueTask(creep_task.name, creep_task.id);
    if (queue_task && queue_task.expected_fillup) {
        queue_task.expected_fillup -= creep_task.creep_exp_fillup;
    }
    if (queue_task)
        reprioritize(queue_task);
}

/**
 * Estimates the time for creep to finish queue_task.
 * @param {Creep} creep 
 * @param {QueueTask} queue_task 
 * @param {number=} max_time
 * @return {number}
 */
task.estimateTime = function(creep, queue_task, max_time) {
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) < 100) 
        return INFINITY;
    let storage = Game.getObjectById(queue_task.id);
    if (!storage) return INFINITY;

    let container  = /** @type {Structure} */ (creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (structure) => {
                return (structure.structureType == STRUCTURE_CONTAINER) &&
                    structure.store[RESOURCE_ENERGY] > 
                    0.5 * structure.store.getCapacity(RESOURCE_ENERGY);
        }
    }));
    if (!container) return INFINITY;

    let energy_path_time = creep.pos.estimatePathCosts(container.pos, 1, creep, max_time);
    if (energy_path_time >= INFINITY) return INFINITY;
    let work_path_time = container.pos.estimatePathCosts(storage.pos, 1, creep, max_time - energy_path_time);
    if (work_path_time >= INFINITY) return INFINITY; 
    
    return work_path_time + energy_path_time;
}
/**
 * 
 * @param {Creep} creep 
 * @param {QueueTask} queue_task 
 * @param {number} min_value
 * @this {Task} 
 */
task.eval_func = function(creep, queue_task, min_value) {
    let structure = Game.getObjectById(queue_task.id);
    let energy = creep.store[RESOURCE_ENERGY] || creep.store.getCapacity(RESOURCE_ENERGY);
    let req_energy = structure.store.getFreeCapacity(RESOURCE_ENERGY);
    let add_energy = Math.min(req_energy, energy);

    let max_time = min_value ? add_energy/min_value : undefined;

    let time = this.estimateTime(creep, queue_task, max_time);
    return add_energy/time;
}
/**
 * 
 * @param {QueueTask} queue_task 
 * @param {StructureSpawn} spawn
 * @return {number} 
 * @this {Task}
 */
task.spawn = function(queue_task, spawn) {
    let self = this;
    return spawn.spawnWithEvalFunc((creep) => self.eval_func(creep, queue_task, 0), "Yak" + Game.time, {role: Role.WORKER});
}

/**
 * @param {Creep} creep
 * @param {CreepTask} creep_task 
 * @return {Frankencreep}
 */
task.creepAfter = function(creep, creep_task) {
    let target = Game.getObjectById(creep_task.id);
    let freePositions = target.pos.getAdjacentGenerallyWalkables();
    if (freePositions.length == 0) {
        error (target, " is unreachable!");
        return null;
    }
    let frankencreep = new Frankencreep(freePositions[0], creep.body.map((part) => part.type), creep.name);
    let energy_start = creep.store[RESOURCE_ENERGY] || creep.store.getFreeCapacity(RESOURCE_ENERGY);
    let use = Math.min(energy_start, target.store.getFreeCapacity(RESOURCE_ENERGY));
    frankencreep.store[RESOURCE_ENERGY] = energy_start - use;
    return frankencreep;
}

export { task };

