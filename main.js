var creep_actions = require("CreepActions");
var task = require("Task");
var spawn_machine = require("SpawnMachine");
var task_machine = require("TaskMachine");
var attack = require("Attack");
var build_machine = require("BuildMachine");
var tower = require("Tower");
var base = require("Base");


var harvest_id = "harvesting";
var upgrade_id = "upgrading";
var store_id = "storing";
var build_id = "building";




module.exports.loop = function () {
    increasePriorities();
    
    Memory.task_mapping = {
        'fill_spawn':     task.fill_spawn_task, //new task.Task('fill_spawn',fillSpawn),
        'upgrade':        task.upgrade_controller_task,
        'build':          task.build_closest_task,
        'fill_store':     task.fill_store_task,
        'repair':         task.repair_task,
        'claim_room':     task.claim_room_task,
        'fill_structure': task.fill_structure_task,
    };
    
    build_machine.monitorBuildRoadTasks();
    
    tower.operateTowers();
 
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
        
        task_machine.createFillTowerTasks();
    }
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
        } 
            
    }

    if (base.numCreeps((creep) => creep.memory.role == "Worker") < 7) {
        spawn_machine.spawnCreep();
    }
    if (_.filter(Game.creeps, (creep) => creep.memory.role == "Miner").length < 4) {
        spawn_machine.spawnMiner();
    }
    if (_.filter(Game.creeps, (creep) => creep.memory.role == "Scout").length < 0) {
        spawn_machine.spawnScout();
    }
    
    //console.log(JSON. stringify(Memory.tasks));
    // UNSAFE
    const targets = Game.spawns['Spawn1'].room.find(FIND_HOSTILE_CREEPS);
    if (targets.length) {
        if (_.filter(Game.creeps, (creep) => creep.memory.role == "Archer").length < 2) {
            spawn_machine.spawnArcher();
        }
    }

    
    _.forEach(Game.creeps, (creep) => {
        if (creep.memory.role != "Archer") {
            const targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
            if(targets.length > 0) {
                creep.moveAwayFrom(targets[0], 3);
                return;
            }
        }
        
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
        } else if (creep.memory.role == "Archer") {
            attack.kite(creep);
        } else {
            if (!creep.memory.task) {
                creep.memory.task = getNextTask(creep);
                if (creep.memory.old_task)
                    creep.say(creep.memory.ticks + creep.memory.old_task.name);
                creep.memory.ticks = 0;
            }
            if (creep.memory.task) {
                ++creep.memory.ticks;
                Memory.task_mapping[creep.memory.task.name].run(creep);
            }
        }
    });

}

function increasePriorities() {
    Memory.tasks.forEach((task) => {
        task.priority++;
    });
}

function getPath(creep, task){
    let first_target = null;
    let second_target = null;
    //console.log(JSON.stringify(task));
    switch (task.name) {
        case "repair":
        case "build":
        case "fill_structure":
            if (task.structure_id) {
                second_target = Game.getObjectById(task.structure_id);
            }
        case "upgrade":
            if (task.controller_id) {
                second_target = Game.getObjectById(task.controller_id);
            }
            
            if (task.store_id) {
                first_target = Game.getObjectById(task.store_id);
            } else if (task.source_id) { // source_id
                first_target = Game.getObjectById(task.source_id);
            }
    }
    if (!first_target || !second_target) return 0;
    return creep.pos.findPathTo(first_target.pos).length +
        first_target.pos.findPathTo(second_target.pos).length;
}

function getNextTask(creep) {
    console.log("Finding task");
    let task_idx = -1;
    let max_priority = -1;
    let path = 0;
    for (let i = 0; i < Memory.tasks.length; i++) {
        let path_cost = getPath(creep, Memory.tasks[i]) + 1;
        
        //console.log("task name: " + Memory.tasks[i].name);
        //console.log("path cost: " + path_cost);
        console.log("priority: " + Memory.tasks[i].priority);
        //console.log("calc priority: " + Memory.tasks[i].priority / path_cost);
        
        //console.log("current best priority: "+ max_priority);
        let current_priority = Memory.tasks[i].priority / path_cost;
        if (current_priority > max_priority) {
           task_idx = i;
           max_priority = current_priority;
           path = path_cost;
       } 
    }
    
    if (task_idx == -1) return null;
    //console.log("Deleting: " + task_idx);
    //console.log("priority: " + max_priority);
    
    return Memory.tasks.splice(task_idx, 1)[0];
}


