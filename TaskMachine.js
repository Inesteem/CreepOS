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
 
var redefineTaskMapping = function() {
    
    Memory.task_mapping = {
        'upgrade':                task.upgrade_controller_task,
        'build':                  task.build_closest_task,
        'fill_store':             task.fill_store_task,
        'repair':                 task.repair_task,
        'claim_room':             task.claim_room_task,
        'fill_structure':         task.fill_structure_task,
        'collect_dropped_energy': task.collect_dropped_energy_task, 
    };
    
}
 
var createBuildTasks = function(){
    let structures = [];
    let rooms = base.getOurRooms();
    
    rooms.forEach(room => {
       structures = structures.concat(room.find(FIND_MY_CONSTRUCTION_SITES));
    });
    structures.sort((a, b) => b.progress - a.progress);
    
    // Update the new task map.
    Memory.new_tasks = Memory.new_tasks || {};
    Memory.new_tasks.build = Memory.new_tasks.build || [];
    for (let structure of structures) {
        if (!Memory.new_tasks.build.find(build_task => build_task.id == structure.id)) {
            Memory.new_tasks.build.push({id: structure.id});
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
    
    // Fill the old task array
    let roads = [structures.filter(s => s.structureType == STRUCTURE_ROAD),
                    constants.PARALLEL_ROAD_BUILD_NUM];
    let extensions = [structures.filter(s => s.structureType == STRUCTURE_EXTENSION),
                    constants.PARALLEL_EXTENSION_BUILD_NUM];
    let container = [structures.filter(s => s.structureType == STRUCTURE_CONTAINER),
                    constants.PARALLEL_CONTAINER_BUILD_NUM];
    let others =  [structures.filter(s => s.structureType != STRUCTURE_EXTENSION && 
                                         s.structureType != STRUCTURE_CONTAINER && 
                                         s.structureType != STRUCTURE_ROAD
                                         ),
                    constants.PARALLEL_CONSTRUCTION_SITE_BUILD_NUM];
    let c_sites = 0;
    [roads,extensions,container,others].forEach(builds => {
        //console.log(JSON.stringify(builds));
        
        for (let i = 0; i < Math.min(builds[0].length, builds[1]); i++){
            if(c_sites >= constants.PARALLEL_CONSTRUCTION_SITE_BUILD_NUM){break;}
            Memory.tasks.push({ 
                name: "build",
                structure_id: builds[0][i].id,
                priority: 0,
            });
            c_sites += 1;
        }
    });
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
        Memory.tasks.push({ 
            name: "repair",
            structure_id: structures[0].id,
            priority: 0,
        });
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
        Memory.tasks.push({ name: "fill_structure",
            structure_id: structures[0].id,
            priority: 0,
        });
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
        Memory.tasks.push({ name: "fill_structure",
            structure_id: structure.id,
            priority: 0,
        });
    })
}

var createUpgradeTasks = function() {
    let controller = [];
    let rooms = base.getOurRooms();
    
    rooms.forEach(room => {
        controller.push(room.controller);
    });
    
    if (controller.length) {
        Memory.tasks.push({ name: "upgrade",
            controller_id: controller[0].id,
            priority: 0,
        });
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
        Memory.tasks.push({ name: "fill_structure",
            structure_id: tower.id,
            priority: 0,
        });
    })
}

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
    redefineTaskMapping : redefineTaskMapping,
    createBuildTasks: createBuildTasks,
    createRepairTasks: createRepairTasks,
    createFillSpawnTasks: createFillSpawnTasks,
    createUpgradeTasks: createUpgradeTasks,
    createFillExtensionTasks: createFillExtensionTasks,
    createFillTowerTasks: createFillTowerTasks,
    createCollectDroppedEnergyTasks : createCollectDroppedEnergyTasks,
};