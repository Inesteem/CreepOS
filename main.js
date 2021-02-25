import "./GameObjects/Creep";
import { monitor as SpawnMachine_monitor } from "./SpawnMachine";
import { monitor as defense_monitor } from "./Defense";
import { operateTowers } from "./GameObjects/Tower";
import { handlePossibleRespawn } from "./Base";
import { Role } from "./Constants";
import { updateTaskQueue, runTask, increasePriorities, completeTask, schedule } from "./Scheduler";
import { error, info } from "./Logging";
import { getSpawns as GameGetSpawns, initGame } from "./GameObjects/Game";
import { monitor as buildMonitor } from "./BuildMachine";
import "./GameObjects/Room";
import { Frankencreep } from "./FrankenCreep";


module.exports.loop = function () {
    for (let task_type in Memory.new_tasks) {
        let task_queue = Memory.new_tasks[task_type];
        for (let task of task_queue) {
            let target = Game.getObjectById(task.id);
            if (target) {
                new RoomVisual(target.room.name).text("" + Math.floor(task.priority), target.pos.x, target.pos.y, {align: "right", font: 0.4}); 
            }
        }
    }



    // Need to redefine functions on Game.
    initGame();
  // error(Game.find(FIND_SOURCES)[0].reservedSlots);

    handlePossibleRespawn();

    increasePriorities();

    buildMonitor();
    
    operateTowers();
    
    Memory.new_tasks = Memory.new_tasks || {};
    if (Game.time % 1 === 0){
        updateTaskQueue();
    }
    
    defense_monitor();

    schedule();
    
    for (let creep of Object.values(Game.creeps)) {
        creep.memory.spawning = undefined;

        if ((creep.room.controller && !creep.room.controller.safeMode) && creep.memory.role != Role.ARCHER) {
            const targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
            if(targets.length > 0) {
                creep.moveAwayFrom(targets[0], 3);
                continue;
            }
        }
        runTask(creep,1);
        
        if (creep.ticksToLive <= 5) {
            while(creep.tasks.length > 0) {
                completeTask(creep);
            }
            creep.suicide();
        }
    }

    SpawnMachine_monitor();

    //FREE MEMORY
    for(var name in Memory.creeps) {
        if(!Game.creeps[name] && !Memory.creeps[name].spawning) {
            delete Memory.creeps[name];
       //     task_machine.createCollectDroppedEnergyTasks();
        } 
            
    }
}


