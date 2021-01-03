/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('TaskMachine');
 * mod.thing == 'a thing'; // true
 */
var task = require("Task");
var base = require("Base");
var constants = require("Constants");
var log = require("Logging");

function refreshTasks() {
    createFillExtensionTasks();
    createFillSpawnTasks();
    createBuildTasks();
    createRepairTasks();
    createUpgradeTasks();
    createFillTowerTasks();
}
 
var createBuildTasks = function(){
    let structures = [];
    let rooms = base.getOurRooms();
    
    rooms.forEach(room => {
       structures = structures.concat(room.find(FIND_MY_CONSTRUCTION_SITES));
    });
    structures.sort((a, b) => b.progress - a.progress);
    
    // Update the new task map.
    Memory.new_tasks.build = Memory.new_tasks.build || [];
    for (let structure of structures) {
        if (!Memory.new_tasks.build.find(build_task => build_task.id == structure.id)) {
            Memory.new_tasks.build.push({id: structure.id, priority: 10, name: "build", base_priority: 20});
        }
    }
    for (let i = 0; i < Memory.new_tasks.build.length; i++) {
        let build_task = Memory.new_tasks.build[i];
        let structure = Game.getObjectById(build_task.id);
        if (!structure) {
            Memory.new_tasks.build.splice(i, 1);
            i--;
        }
    }
    log.info("Build tasks: ", Memory.new_tasks.build);
}

var createRepairTasks = function() {
    let structures = [];
    let rooms = base.getOurRooms();
    
    rooms.forEach(room => {
       structures = structures.concat(room.find(FIND_STRUCTURES, {
            filter: object => object.hits && object.hits < object.hitsMax
        }));
    });
    structures.sort((a, b) => a.hits - b.hits);
        
    // Update the new task map
     Memory.new_tasks.repair = Memory.new_tasks.repair || [];
    for (let structure of structures) {
        if (!Memory.new_tasks.repair.find(repair_task => repair_task.id == structure.id)) {
            Memory.new_tasks.repair.push({id: structure.id, priority: 0, name:"repair", basePriority: 0});
        }
    }
    for (let i = 0; i < Memory.new_tasks.repair.length; i++) {
        let repair_task = Memory.new_tasks.repair[i];
        let structure = Game.getObjectById(repair_task.id);
        if (!structure || structure.hits == structure.hitsMax) {
            Memory.new_tasks.repair.splice(i, 1);
            i--;
        }
    }
    log.info("Repair tasks: ", Memory.new_tasks.repair);
}

var createFillSpawnTasks = function() {
    let structures = [];
    let rooms = base.getOurRooms();
    
    rooms.forEach(room => {
       structures = structures.concat(room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                    return ( structure.structureType == STRUCTURE_SPAWN) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
        }));
    });
    
    // Update the new task map
    Memory.new_tasks.fill = Memory.new_tasks.fill || [];
    for (let structure of structures) {
        if (!Memory.new_tasks.fill.find(fill_task => fill_task.id == structure.id)) {
            Memory.new_tasks.fill.push({id: structure.id, priority: 100, name:"fill_structure", base_priority: 100});
        }
    }
    for (let i = 0; i < Memory.new_tasks.fill.length; i++) {
        let fill_task = Memory.new_tasks.fill[i];
        let structure = Game.getObjectById(fill_task.id);
        if (!structure || structure.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
            Memory.new_tasks.fill.splice(i, 1);
            i--;
        }
    }
    log.info("Fill tasks: ", Memory.new_tasks.fill);
}

var createFillExtensionTasks = function() {
       let structures = [];
    let rooms = base.getOurRooms();
    
    rooms.forEach(room => {
       structures = structures.concat(room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                    return ( structure.structureType == STRUCTURE_EXTENSION) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
        }));
    });
    
    // Update the new task map
    Memory.new_tasks.fill = Memory.new_tasks.fill || [];
    for (let structure of structures) {
        if (!Memory.new_tasks.fill.find(fill_task => fill_task.id == structure.id)) {
            Memory.new_tasks.fill.push({id: structure.id, priority: 90, name:"fill_structure", base_priority: 0});
        }
    }
    for (let i = 0; i < Memory.new_tasks.fill.length; i++) {
        let fill_task = Memory.new_tasks.fill[i];
        let structure = Game.getObjectById(fill_task.id);
        if (!structure || structure.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
            Memory.new_tasks.fill.splice(i, 1);
            i--;
        }
    }
    log.info("Fill tasks: ", Memory.new_tasks.fill);
}

var createUpgradeTasks = function() {
    let controller = [];
    let rooms = base.getOurRooms();
    
    rooms.forEach(room => {
        controller.push(room.controller);
    });
    
    // Update the new task map
    Memory.new_tasks.upgrade = Memory.new_tasks.upgrade || [];
    for (let structure of controller) {
        if (!Memory.new_tasks.upgrade.find(controller_task => controller_task.id == structure.id)) {
            Memory.new_tasks.upgrade.push({id: structure.id, priority: 0, name:"upgrade", base_priority: 0});
        }
    }
    // TODO when to delete those tasks?
    log.info("Upgrade tasks: ", Memory.new_tasks.upgrade);
}

function createFillTowerTasks() {
    let towers = [];
    let rooms = base.getOurRooms();
    
    rooms.forEach(room => {
        towers = towers.concat(room.find(FIND_MY_STRUCTURES, {
            filter: (tower) => {
                    return ( tower.structureType == STRUCTURE_TOWER) &&
                        tower.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
        }));
    });
    // Update the new task map
    Memory.new_tasks.fill = Memory.new_tasks.fill || [];
    for (let structure of towers) {
        if (!Memory.new_tasks.fill.find(fill_task => fill_task.id == structure.id)) {
            Memory.new_tasks.fill.push({id: structure.id, priority: 50, name: "fill_structure", base_priority: 50});
        }
    }
    for (let i = 0; i < Memory.new_tasks.fill.length; i++) {
        let fill_task = Memory.new_tasks.fill[i];
        let structure = Game.getObjectById(fill_task.id);
        if (!structure || structure.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
            Memory.new_tasks.fill.splice(i, 1);
            i--;
        }
    }
    log.info("Fill tasks: ", Memory.new_tasks.fill);
}

// TODO change to new task format
function createCollectDroppedEnergyTasks() {
    let rooms = base.getOurRooms();
    let dropped_energy = [];
    
    rooms.forEach(room => {
        dropped_energy = dropped_energy.concat(room.find(FIND_DROPPED_RESOURCES, {
                filter: (d) => d.amount >= 1 && d.resourceType == RESOURCE_ENERGY
            }));
    });
    
    for(let i = 0; i < dropped_energy.length; ++i){ 
        console.log("energy: "+JSON.stringify(dropped_energy[i]));
        
            Memory.tasks.push({
               name: "collect_dropped_energy",
               priority: 100,
               resource: dropped_energy[i].id, 
            });

    }
}

module.exports = {
    refreshTasks: refreshTasks,
};