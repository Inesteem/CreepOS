import "./Creep";
import { monitor as SpawnMachine_monitor } from "./SpawnMachine";
import { monitor as defense_monitor } from "./Defense";
import { monitorBuildRoadTasks } from "./BuildMachine";
import { operateTowers } from "./Tower";
import { handlePossibleRespawn } from "./Base";
import { Role } from "./Constants";
import { updateTaskQueue, runTask, increasePriorities, completeTask } from "./Scheduler";

module.exports.loop = function () {
    handlePossibleRespawn();

    increasePriorities();
    
    monitorBuildRoadTasks();
    
    operateTowers();
    
    Memory.new_tasks = Memory.new_tasks || {};
    if (Game.time % 10 === 0){
        updateTaskQueue();
    }
    
    SpawnMachine_monitor();
    
    defense_monitor();
    
    for (let creep of Object.values(Game.creeps)) {
        
        if (!creep.room.controller.safeMode && creep.memory.role != Role.ARCHER) {
            const targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
            if(targets.length > 0) {
                creep.moveAwayFrom(targets[0], 3);
                continue;
            }
        }
        runTask(creep,1);
    }
    //FREE MEMORY
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            //TODO
            completeTask({memory : Memory.creeps[name]});
            //completeTask(/**@type Creep */ ({id : "id", memory : Memory.creeps[name]}));
            delete Memory.creeps[name];
       //     task_machine.createCollectDroppedEnergyTasks();
        } 
            
    }
}


