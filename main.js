var creep_actions = require("CreepActions");
var task = require("Task");
var spawn_machine = require("SpawnMachine");

var harvest_id = "harvesting";
var upgrade_id = "upgrading";
var store_id = "storing";
var build_id = "building";




module.exports.loop = function () {
    
    if(Memory.tasks.length < 10)
        Memory.tasks = ["fill_store", "fill_store", "build","fill_spawn","upgrade","build","fill_spawn","upgrade","build","fill_spawn","upgrade","build","fill_spawn","upgrade"];
        
    console.log(JSON. stringify(Memory.tasks));
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
        } 
            
    }

    if (_.filter(Game.creeps, (creep) => true).length < 9) {
        spawn_machine.spawnCreep();
    }

    var task_mapping = {
        'fill_spawn':   task.fill_spawn_task, //new task.Task('fill_spawn',fillSpawn),
        'upgrade':      task.upgrade_controller_task,
        'build':        task.build_closest_task,
        'fill_store':   task.fill_store_task,
    };

    _.forEach(Game.creeps, (creep) => {
        if (!creep.memory.task || !creep.memory.task.name) {
            creep.memory.task = {name: Memory.tasks.shift()};
        } else {
            task_mapping[creep.memory.task.name].run(creep);
        }
    });

}


