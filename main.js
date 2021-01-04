require("Creep");
var task = require("Task");
var spawn_machine = require("SpawnMachine");
var task_machine = require("TaskMachine");
var defense = require("Defense");
var build_machine = require("BuildMachine");
var tower = require("Tower");
var base = require("Base");
var constants = require("Constants");
var algorithm = require("Algorithm");
var log = require("Logging");
require("RoomPosition");
var scheduler = require("Scheduler");


var harvest_id = "harvesting";
var upgrade_id = "upgrading";
var store_id = "storing";
var build_id = "building";



module.exports.loop = function () {
    
    base.handlePossibleRespawn();

    scheduler.increasePriorities();
    
    build_machine.monitorBuildRoadTasks();
    
    tower.operateTowers();
    
    Memory.new_tasks = Memory.new_tasks || {};
    if (Game.time % 10 === 0){
        scheduler.updateTaskQueue();
    }
    
    spawn_machine.monitor();
    
    defense.monitor();
    
    _.forEach(Game.creeps, (creep) => {
        
        if (!creep.room.controller.safeMode && creep.memory.role != constants.Role.ARCHER) {
            const targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
            if(targets.length > 0) {
                creep.moveAwayFrom(targets[0], 3);
                return;
            }
        }
        scheduler.runTask(creep,10);
    });
    //FREE MEMORY
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
       //     task_machine.createCollectDroppedEnergyTasks();
        } 
            
    }
}


