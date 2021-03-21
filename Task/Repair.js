import { QueueTask, CreepTask, State, takeFromStore, Task, findQueueTask } from "./Task";
import { info, error} from "../Logging";
import "../GameObjects/Game";
import { Frankencreep } from "../FrankenCreep";
import { INFINITY, REPAIR_DEFAULT_PRIORITY, REPAIR_PRIORITY, PRIORITY_LEVEL_STEP, Role} from "../Constants";

const task = Object.create(new Task("repair"));
task.state_array = [
    new State(takeFromStore),
    new State(repairStructure),
];

function repairStructure(creep) {
    let structure = Game.getObjectById(creep.task.id);
    
    if(!structure){
        return false;
    }
    
    creep.repairStructure(structure);
    
    if (creep.store[RESOURCE_ENERGY] == 0 ||
            structure.hits == structure.hitsMax) {
        return false;
    }
    return true;
}

/**
 * @this {{name: string}} 
 */
task.updateQueue = function() {
    this.removeObsoleteTasks();
    this.addNewTasks();
}

/**
 * @this {{queue: Array<QueueTask>}}
 */
task.removeObsoleteTasks = function() {
    const structures = getStructuresToRepair();
    this.queue = this.queue.filter((queue_task) => structures.find((structure) => structure.id === queue_task.id));
}

/**
 * @this {{queue: Array<QueueTask>}}
 */
task.addNewTasks = function() {
    const structures = getStructuresToRepair();
    
    for (let structure of structures) {
        if (!this.queue.find((queue_task) => structure.id === queue_task.id)) {
            const queue_task = {id: structure.id, priority: 500, name: this.name};
            prioritize(queue_task);
            this.queue.push(queue_task);
        }
    }
}

function getStructuresToRepair() {
    return Game.find(FIND_STRUCTURES, {
        filter: object => object.hits && object.hits < object.hitsMax 
            && object.structureType !== STRUCTURE_ROAD
            && object.structureType !== STRUCTURE_WALL
    });
}

/**
 * Estimates the time for creep to finish queue_task.
 * @param {Creep} creep 
 * @param {QueueTask} queue_task 
 * @param {number=} max_time
 * @return {number}
 */
task.estimateTime = function(creep, queue_task, max_time) {
    let structure = /**@type {Structure} */ (Game.getObjectById(queue_task.id));
    if (!structure) return INFINITY;
    if (creep.getActiveBodyparts(WORK) == 0) return INFINITY;

    let to_repair = structure.hitsMax - structure.hits;
    let energy = Math.min(to_repair/100, creep.store[RESOURCE_ENERGY] || creep.store.getCapacity(RESOURCE_ENERGY));
    let repair_time = energy/creep.getActiveBodyparts(WORK);

    if (!creep.store[RESOURCE_ENERGY]) {
        let energy_struct = creep.findOptimalEnergy(structure.pos, max_time - repair_time);
        if (!energy_struct || !energy_struct.object) return INFINITY;

        let harvest_time = 0;
        if (energy_struct.type == FIND_SOURCES) {
            if (creep.getActiveBodyparts(WORK) == 0) return INFINITY;
            let capacity = creep.store.getFreeCapacity(RESOURCE_ENERGY);
            harvest_time = capacity / (2 * creep.getActiveBodyparts(WORK));
        }

        let energy_path_time = creep.pos.estimatePathCosts(energy_struct.object.pos, 1, creep, max_time - harvest_time - repair_time);
        if (energy_path_time >= INFINITY) return INFINITY;
        let work_path_time = energy_struct.object.pos.estimatePathCosts(structure.pos, 3, creep, max_time - harvest_time - energy_path_time - repair_time);
        if (work_path_time >= INFINITY) return INFINITY; 
        
        return work_path_time + energy_path_time + harvest_time + repair_time;
    }


    let path_costs = creep.pos.estimatePathCosts(structure.pos, 3, creep, max_time - repair_time);
    return path_costs + repair_time;
}


/**
 * @param {Creep} creep
 * @param {QueueTask} queue_task 
 * @return {?CreepTask}
 */
task.take = (creep, queue_task) => {
    let structure = Game.getObjectById(queue_task.id);
    
    if (!structure) return null;
    
    let add_hits = (creep.store[RESOURCE_ENERGY] || creep.store.getCapacity(RESOURCE_ENERGY)) * 100;
    
    queue_task.expected_hits = (queue_task.expected_hits || 0) + add_hits;
    
    reprioritize(queue_task);
    
    let creep_task = {};
    creep_task.creep_exp_hits = add_hits;
    
    creep_task.id = queue_task.id;
    creep_task.name = queue_task.name;

    return creep_task;
}


/**
 * @param {QueueTask} queue_task 
 */
function prioritize(queue_task) {
    let structure = Game.getObjectById(queue_task.id);
    queue_task.priority = REPAIR_PRIORITY[structure.structureType];
    if (!queue_task.priority) {
        queue_task.priority = REPAIR_DEFAULT_PRIORITY;
    }
}

/**
 * Updates priority after the task was taken.
 * @param {QueueTask} queue_task 
 */
function reprioritize(queue_task) {
    let structure = Game.getObjectById(queue_task.id);
    if (!structure) {
        queue_task.priority = 0;
        return;
    }
    
    let expected_hits_total = structure.hits + (queue_task.expected_hits || 0);
    
    let completion = expected_hits_total / structure.hitsMax;

    if (completion >= 1) {
        queue_task.priority = 0;
    } else {
        prioritize(queue_task);
        queue_task.priority += (1-completion) * PRIORITY_LEVEL_STEP;
    }
}

/**
 * Finishes the task taken by take.
 * @param {Creep} creep 
 * @param {CreepTask} creep_task 
 */
task.finish = (creep, creep_task) => {
    let queue_task = findQueueTask(creep_task.name, creep_task.id);
    if (!queue_task) return;
    if (queue_task.expected_hits){ 
        queue_task.expected_hits -= creep_task.creep_exp_hits;
        reprioritize(queue_task);
    }
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
    let req_energy = (structure.hitsMax - structure.hits)/100;
    let add_energy = Math.min(req_energy, energy);

    let max_time = min_value ? add_energy/min_value : undefined;

    let time = this.estimateTime(creep, queue_task, max_time) + 1;
    if (time >= INFINITY) return 0;
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
    return spawn.spawnWithEvalFunc((creep) => self.eval_func(creep, queue_task, 0), "Mario" + Game.time, {role: Role.WORKER});
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
    let to_repair = target.hitsMax - target.hits;
    let use = Math.min(to_repair/100, creep.store[RESOURCE_ENERGY] || creep.store.getCapacity(RESOURCE_ENERGY));
    frankencreep.store[RESOURCE_ENERGY] = energy_start - use;
    return frankencreep;
}

export {task};