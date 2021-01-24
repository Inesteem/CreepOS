import "./Creep";
import { monitor as SpawnMachine_monitor } from "./SpawnMachine";
import { monitor as defense_monitor } from "./Defense";
import { operateTowers } from "./Tower";
import { handlePossibleRespawn } from "./Base";
import { Role } from "./Constants";
import { updateTaskQueue, runTask, increasePriorities, completeTask, schedule } from "./Scheduler";
import { error, info } from "./Logging";
import { getSpawns as GameGetSpawns } from "./Game";
import { monitor as buildMonitor } from "./BuildMachine";
import "./Room";


module.exports.loop = function () {
    handlePossibleRespawn();

    increasePriorities();

    buildMonitor();
    
    operateTowers();
    
    Memory.new_tasks = Memory.new_tasks || {};
    if (Game.time % 1 === 0){
        updateTaskQueue();
    }
    
    defense_monitor();
    
    for (let creep of Object.values(Game.creeps)) {
        
        if ((creep.room.controller && !creep.room.controller.safeMode) && creep.memory.role != Role.ARCHER) {
            const targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
            if(targets.length > 0) {
                creep.moveAwayFrom(targets[0], 3);
                continue;
            }
        }
        runTask(creep,1);
    }

    schedule();

    SpawnMachine_monitor();

    //FREE MEMORY
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            //TODO
            if (Memory.creeps[name].task) {
                completeTask({memory : Memory.creeps[name]});
            }
            //completeTask(/**@type Creep */ ({id : "id", memory : Memory.creeps[name]}));
            delete Memory.creeps[name];
       //     task_machine.createCollectDroppedEnergyTasks();
        } 
            
    }
}


