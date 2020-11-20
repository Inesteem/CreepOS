var creep_actions = require("CreepActions");
var task = require("Task");
var spawn_machine = require("SpawnMachine");

var harvest_id = "harvesting";
var upgrade_id = "upgrading";
var store_id = "storing";
var build_id = "building";




module.exports.loop = function () {
    if(Memory.tasks.length < 2) {
        var room = Game.rooms['W18S6'];
        if (room.energyAvailable <
            room.energyCapacityAvailable) {
            Memory.tasks.push("fill_spawn");
            Memory.tasks.push("fill_spawn");
        }
        
        var construction = room.find(FIND_MY_CONSTRUCTION_SITES);
        if (construction.length) {
            Memory.tasks.push("build");
            //Memory.tasks.push("build");
        }
        
        var storage  = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE ||
                    structure.structureType == STRUCTURE_CONTAINER) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
        });
        if (storage) {
            // Memory.tasks.push("fill_store");
            //Memory.tasks.push("fill_store");
        }
        
        broken_structures = room.find(FIND_STRUCTURES, {
            filter: object => object.hits < object.hitsMax
        });
        if (broken_structures) {
            Memory.tasks.push("repair");
        }
        
        while(Memory.tasks.length < 4) {
            Memory.tasks.push("upgrade");
        }
    }
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
        } 
            
    }

    if (_.filter(Game.creeps, (creep) => !creep.memory.miner).length < 5) {
        spawn_machine.spawnCreep();
    }
    if (_.filter(Game.creeps, (creep) => creep.memory.miner).length < 4) {
        spawn_machine.spawnMiner();
    }

    var task_mapping = {
        'fill_spawn':   task.fill_spawn_task, //new task.Task('fill_spawn',fillSpawn),
        'upgrade':      task.upgrade_controller_task,
        'build':        task.build_closest_task,
        'fill_store':   task.fill_store_task,
        'repair':       task.repair_task
    };
    console.log(JSON. stringify(Memory.tasks));
    _.forEach(Game.creeps, (creep) => {
        if (creep.memory.miner == true) {
            // Miners are special and can almost not move. Remove this once we
            // properly map tasks.
             if (!creep.memory.task || !creep.memory.task.name) {
                creep.memory.task = {name: 'fill_store'};
            } else {
                task_mapping[creep.memory.task.name].run(creep);
            }
        } else {
            if (!creep.memory.task || !creep.memory.task.name) {
                creep.memory.task = {name: Memory.tasks.shift()};
            } else {
                task_mapping[creep.memory.task.name].run(creep);
            }
        }
    });

}


