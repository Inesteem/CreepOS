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
 
var createEnergyReqTask = function(task, target) {
    let store = base.findNearestEnergyStored(target);
        
    if (store) {
        task.store_id = store.id;
        Memory.tasks.push(task);
    } else {
        let source = base.findNearestEnergySource(target);
        if (source) {
            task.source_id = source.id;
            Memory.tasks.push(task);
        }
    }
}
 
var createBuildTasks = function(){
    let structures = [];
    let rooms = base.getOurRooms();
    
    rooms.forEach(room => {
       structures = structures.concat(room.find(FIND_MY_CONSTRUCTION_SITES));
    });
    structures.sort((a, b) => b.progress - a.progress);
    
    if(structures.length){
        createEnergyReqTask({ name: "build",
            structure_id: structures[0].id,
            priority: 0,
        }, structures[0]);
    }
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
        
    if(structures.length){
        createEnergyReqTask({ name: "repair",
            structure_id: structures[0].id,
            priority: 0,
        }, structures[0]);
    }
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
    
    if(structures.length){
        createEnergyReqTask({ name: "fill_structure",
            structure_id: structures[0].id,
            priority: 0,
        }, structures[0]);
    }
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
    
    structures.forEach(structure => {
        createEnergyReqTask({ name: "fill_structure",
            structure_id: structure.id,
            priority: 0,
        }, structure);
    })
}

var createUpgradeTasks = function() {
    let controller = [];
    let rooms = base.getOurRooms();
    
    rooms.forEach(room => {
        controller.push(room.controller);
    });
    
    if (controller.length) {
        createEnergyReqTask({ name: "upgrade",
            controller_id: controller[0].id,
            priority: 0,
        }, controller[0]);
    }
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
    
    towers.forEach(tower => {
        createEnergyReqTask({ name: "fill_structure",
            structure_id: tower.id,
            priority: 0,
        }, tower);
    })
}

module.exports = {
    createBuildTasks: createBuildTasks,
    createRepairTasks: createRepairTasks,
    createFillSpawnTasks: createFillSpawnTasks,
    createUpgradeTasks: createUpgradeTasks,
    createFillExtensionTasks: createFillExtensionTasks,
    createFillTowerTasks: createFillTowerTasks
};