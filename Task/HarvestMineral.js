
import { Role, INFINITY, PRIORITY_LEVEL_STEP } from "../Constants";
import { error } from "../Logging";
import {  QueueTask, CreepTask, State, Task } from "./Task";

export const task = Object.create(new Task("harvestMineral"));
task.state_array = [
    new State(harvestMineral),
    new State(storeMineral)
];

task.name = "harvestMineral";

/**
 * @this {{queue: Array<QueueTask>, name: string}}
 */
task.updateQueue = function() {
    
    //   let labs = Game.find(FIND_MY_STRUCTURES, {filter : (s) => {
 //       const r_type = s.mineralType;
 //       return s.structureType === STRUCTURE_LAB && (
 //           !r_type || s.store.getFreeCapacity(r_type) > 0); 
 //       }});
 //   
 //   let extractors = Game.find(FIND_STRUCTURES, {filter : {structreType: STRUCTURE_EXTRACTOR}});
 //   
 //   //remove lost extractors
 //   this.queue = this.queue.filter(task => extractors.find(s => s.id === task.id) 
 //                                       && labs.find(l => l.id === task.lab_id));  
 //   extractors = extractors.filter(e => this.queue.find(task => task.id === e.id) === undefined);  
 //  
 //   
 //   // create new task
 //   for (let e of extractors) {
 //       let m = e.pos.lookForObject(LOOK_MINERALS);
 //       let lab = m.pos.findClosestTarget(labs.filter(lab => lab.mineralType == undefined || lab.mineralType == m.mineralType), 1);
 //       error(lab, m);
 //       if(!lab) continue;
 //       let queue_task = {id : e.id, mineral_id : m.id, lab_id : lab.target.id, name : this.name, priority : 2 * PRIORITY_LEVEL_STEP};
 //       this.queue.push(queue_task);
 //   } 

    //TODO: remove tasks under condition (lab storage full, etc)
}


function harvestMineral(creep) {
   //let extractor = Game.getObjectById(this.task.id);
   const mineral = Game.getObjectById(creep.task.mineral_id);

   if(!mineral) return false;

   //TODO harvest from mineral ?
   creep.harvestFrom(mineral);

   if (creep.store.getFreeCapacity(mineral.mineralType) == 0) {
       return false;
   }

   return true;
}

function storeMineral(creep){
    const lab = Game.getObjectById(creep.task.lab_id);
    const mineral = Game.getObjectById(creep.task.mineral_id);

    if (!mineral || !lab || lab.store.getFreeCapacity(mineral.mineralType) == 0) 
        return false;
    
    creep.storeAt(lab, mineral.mineralType);

    if(creep.store[mineral.mineralType] === 0)    
        return false;

    return true;
}

task.take = (creep, queue_task) => {

    //todo
    let creep_task = {};
    creep_task.id = queue_task.id;
    creep_task.mineral_id = queue_task.mineral_id;
    creep_task.lab_id = queue_task.lab_id;
    creep_task.name = queue_task.name;
   
    return creep_task;
}

task.finish = (creep, creep_task) => {}

/**
 * Estimates the time for creep to finish queue_task.
 * @param {Creep} creep 
 * @param {QueueTask} queue_task 
 * @param {number=} max_time
 * @return {number}
 */
task.estimateTime = function(creep, queue_task, max_time) {
    const num_work_parts = creep.getActiveBodyparts(WORK); 
    if(num_work_parts === 0) return INFINITY; 
    
    const capacity = creep.store.getCapacity(RESOURCE_ENERGY);
    const harvest_time = capacity / (2 * num_work_parts);

    const lab = Game.getObjectById(queue_task.lab_id);
    const mineral = Game.getObjectById(queue_task.mineral_id);
    if(!mineral || !lab) return INFINITY;
    
    const path_to_min = creep.pos.estimatePathCosts(mineral.pos, 1, creep, max_time - harvest_time);
    const path_to_lab = mineral.pos.estimatePathCosts(lab.pos, 1, creep, max_time - (path_to_min + harvest_time));

    return path_to_min + harvest_time + path_to_lab;
}

/**
 * Evaluates the creep.
 * @this {Task} 
 * @param {Creep} creep 
 * @param {QueueTask} queue_task 
 * @param {number=} min_value
 * @return {number}
 */
task.eval_func = function(creep, queue_task, min_value) {
    const capacity = creep.store.getCapacity(RESOURCE_ENERGY);
    let max_time = min_value ? (capacity/min_value) : undefined;
    let time = this.estimateTime(creep, queue_task, max_time ) + 1;
    return capacity / time; 
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
    return spawn.spawnWithEvalFunc((creep) => self.eval_func(creep, queue_task, 0), "MineralMiner" + Game.time, {role: Role.WORKER});
}