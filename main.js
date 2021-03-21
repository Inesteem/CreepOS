import "./GameObjects/Creep";
import { monitor as SpawnMachine_monitor } from "./SpawnMachine";
import { monitor as defense_monitor } from "./Defense";
import { operateTowers } from "./GameObjects/Tower";
import { handlePossibleRespawn } from "./Base";
import { Role } from "./Constants";
import { updateTaskQueue, runTask, increasePriorities, completeTask, schedule } from "./Scheduler";
import { error, info, profileCpu } from "./Logging";
import { getSpawns as GameGetSpawns, initGame } from "./GameObjects/Game";
import { monitor as buildMonitor } from "./BuildMachine";
import "./GameObjects/Room";
import { Frankencreep } from "./FrankenCreep";
import { CachedMap } from "./CachedMap";

module.exports.loop = function () {

    // let test_map = new CachedMap("test");
    // test_map.set("foo", "bar");
    // error(test_map.get("foo"));
    // test_map.save();

    // Need to redefine functions on Game.
    profileCpu("initGame", initGame);
  // error(Game.find(FIND_SOURCES)[0].reservedSlots);

    profileCpu("handle respawn", handlePossibleRespawn);

    profileCpu("increase Priorities", increasePriorities);

    profileCpu("build monitor", buildMonitor);
    
    profileCpu("operate towers", operateTowers);
    
    profileCpu("update queue tasks", () => {
    Memory.new_tasks = Memory.new_tasks || {};
    if (Game.time % 1 === 0){
        updateTaskQueue();
    }
    });
    
    profileCpu("defense monitor", () => {
    defense_monitor();
    });

    profileCpu("schedule", () => {
    schedule();
    });
    
    profileCpu("run tasts", () => {
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
    });

    profileCpu("spawn machine", () => {
    SpawnMachine_monitor();
    });

    profileCpu("free memory", () => {
    //FREE MEMORY
    for(var name in Memory.creeps) {
        if(!Game.creeps[name] && !Memory.creeps[name].spawning) {
            delete Memory.creeps[name];
       //     task_machine.createCollectDroppedEnergyTasks();
        } 
            
    }
    });

    profileCpu("visuals", () => {
    for (let task_type in Memory.new_tasks) {
        let task_queue = Memory.new_tasks[task_type];
        for (let task of task_queue) {
            let target = Game.getObjectById(task.id);
            if (target && target.room) {
                new RoomVisual(target.room.name).text("" + Math.floor(task.priority), target.pos.x, target.pos.y, {align: "right", font: 0.4}); 
            }
        }
    }
});

}


