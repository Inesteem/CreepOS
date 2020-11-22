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
        'fill_spawn':   task.fill_spawn_task, //new task.Task('fill_spawn',fillSpawn),
        'upgrade':      task.upgrade_controller_task,
        'build':        task.build_closest_task,
        'fill_store':   task.fill_store_task,
        'repair':       task.repair_task
    };
 
    
    if(Memory.tasks.length < 2) {
        var room = Game.rooms['W18S6'];
        if (room.energyAvailable <
            room.energyCapacityAvailable) {
            Memory.tasks.push({name: "fill_spawn"});
            Memory.tasks.push({name: "fill_spawn"});
            Memory.tasks.push({name: "fill_spawn"});
        }
        
        var construction = room.find(FIND_MY_CONSTRUCTION_SITES);
        if (construction.length) {
           // Memory.tasks.push({name: "build"});
            task_machine.createBuildTasks();
            task_machine.createBuildTasks();
            
        }
        
        var storage  = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE ||
                    structure.structureType == STRUCTURE_CONTAINER) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
        });
        if (storage) {
            //Memory.tasks.push("fill_store");
            //Memory.tasks.push("fill_store");
        }
        
        broken_structures = room.find(FIND_STRUCTURES, {
            filter: object => object.hits < object.hitsMax
        });
        if (broken_structures) {
            Memory.tasks.push({name: "repair"});
            Memory.tasks.push({name: "repair"});
        }
        
        while(Memory.tasks.length < 6) {
            Memory.tasks.push({name: "upgrade"});
        }
    }
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
        } 
            
    }

    if (_.filter(Game.creeps, (creep) => !creep.memory.miner).length < 15) {
        spawn_machine.spawnCreep();
    }
    if (_.filter(Game.creeps, (creep) => creep.memory.miner).length < 4) {
        spawn_machine.spawnMiner();
    }

    //console.log(JSON. stringify(Memory.tasks));
    _.forEach(Game.creeps, (creep) => {
        if (creep.memory.miner == true) {
            // Miners are special and can almost not move. Remove this once we
            // properly map tasks.
             if (!creep.memory.task || !creep.memory.task.name) {
                creep.memory.task = {name: 'fill_store'};
            } else {
                Memory.task_mapping[creep.memory.task.name].run(creep);
            }
        } else {
            if (!creep.memory.task || !creep.memory.task.name) {
               // creep.memory.task = {name: Memory.tasks.shift()};
                creep.memory.task = Memory.tasks.shift(); 
            } else {
                Memory.task_mapping[creep.memory.task.name].run(creep);
            }
        }
    });

}


