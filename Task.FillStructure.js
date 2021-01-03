var tasks = require("Task");
var base = require("Base");

function updateQueue() {
    let structures = [];
    let rooms = base.getOurRooms();
    
    // SPAWN
    
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
            Memory.new_tasks.fill.push({id: structure.id, priority: 0, name:"fill_structure"});
        }
    }
    
    // EXTENSIONS
    
    structures = [];
    
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
            Memory.new_tasks.fill.push({id: structure.id, priority: 0, name:"fill_structure"});
        }
    }
    
    // TOWERS
    
    let towers = [];
    
    rooms.forEach(room => {
        towers = towers.concat(room.find(FIND_MY_STRUCTURES, {
            filter: (tower) => {
                    return ( tower.structureType == STRUCTURE_TOWER) &&
                        tower.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
        }));
    });
    
    Memory.new_tasks.fill = Memory.new_tasks.fill || [];
    for (let structure of towers) {
        if (!Memory.new_tasks.fill.find(fill_task => fill_task.id == structure.id)) {
            Memory.new_tasks.fill.push({id: structure.id, priority: 0, name: "fill_structure"});
        }
    }
    
    // DELETION
    for (let i = 0; i < Memory.new_tasks.fill.length; i++) {
        let fill_task = Memory.new_tasks.fill[i];
        let structure = Game.getObjectById(fill_task.id);
        if (!structure || structure.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
            Memory.new_tasks.fill.splice(i, 1);
            i--;
        }
    }
}

var task = new tasks.Task("fill_structure", null);

task.state_array = [
    new tasks.State(tasks.takeFromStore),
    new tasks.State(tasks.fillStructure)
];

module.exports = {
    updateQueue: updateQueue,
    task: task
};

