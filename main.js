var creep_actions = require("CreepActions");
var task = require("Task");
var spawn_machine = require("SpawnMachine");
var task_machine = require("TaskMachine");


var harvest_id = "harvesting";
var upgrade_id = "upgrading";
var store_id = "storing";
var build_id = "building";




module.exports.loop = function () {
    
    Memory.task_mapping = {
        'fill_spawn':     task.fill_spawn_task, //new task.Task('fill_spawn',fillSpawn),
        'upgrade':        task.upgrade_controller_task,
        'build':          task.build_closest_task,
        'fill_store':     task.fill_store_task,
        'repair':         task.repair_task,
        'claim_room':     task.claim_room_task,
        'fill_structure': task.fill_structure_task,
    };
 
    
    if(Memory.tasks.length < 2) {
        task_machine.createFillSpawnTasks();
        task_machine.createFillExtensionTasks();
        
        task_machine.createBuildTasks();
        task_machine.createBuildTasks();
        task_machine.createBuildTasks();
        
        task_machine.createRepairTasks();
         task_machine.createRepairTasks();
          task_machine.createRepairTasks();
        
        task_machine.createUpgradeTasks();
    }
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
        } 
            
    }

    if (_.filter(Game.creeps, (creep) => creep.memory.role == "Worker").length < 5) {
        spawn_machine.spawnCreep();
    }
    if (_.filter(Game.creeps, (creep) => creep.memory.role == "Miner").length < 5) {
        spawn_machine.spawnMiner();
    }
    if (_.filter(Game.creeps, (creep) => creep.memory.role == "Scout").length < 0) {
        spawn_machine.spawnScout();
    }

    //console.log(JSON. stringify(Memory.tasks));
    _.forEach(Game.creeps, (creep) => {
        if (creep.memory.role == "Miner") {
            // Miners are special and can almost not move. Remove this once we
            // properly map tasks.
             if (!creep.memory.task || !creep.memory.task.name) {
                creep.memory.task = {name: 'fill_store'};
            } else {
                Memory.task_mapping[creep.memory.task.name].run(creep);
            }
        } else if (creep.memory.role == "Scout") {
               if (!creep.memory.task || !creep.memory.task.name) {
                creep.memory.task = {name: 'claim_room'};
            } else {
                Memory.task_mapping[creep.memory.task.name].run(creep);
            }   
        } else {
            if (!creep.memory.task) {
                creep.memory.task = Memory.tasks.shift();
                if (creep.memory.old_task)
                    creep.say(creep.memory.old_task.name + ": " + creep.memory.ticks);
                creep.memory.ticks = 0;
            }
            if (creep.memory.task) {
                ++creep.memory.ticks;
                Memory.task_mapping[creep.memory.task.name].run(creep);
            }
        }
    });

}


