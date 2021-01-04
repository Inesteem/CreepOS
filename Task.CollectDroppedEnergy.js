var tasks = require("Task");
var task = new tasks.Task("collect_dropped_energy", null);
var base = require("Base");
var log = require("Logging");

task.state_array = [
    new tasks.State(collectDroppedEnergy),
    new tasks.State(tasks.fillStore),
];

function updateQueue() {
    let rooms = base.getOurRooms();
    let dropped_energy = [];
    
    rooms.forEach(room => {
        dropped_energy = dropped_energy.concat(room.find(FIND_DROPPED_RESOURCES, {
                filter: (d) => d.amount >= 20 && d.resourceType == RESOURCE_ENERGY
            }));
    });
    
    Memory.new_tasks.dropped_energy = Memory.new_tasks.dropped_energy || [];
    for (let drop of dropped_energy) {
        if (!Memory.new_tasks.dropped_energy.find(drop_task => drop_task.id == drop.id)) {
            let queue_task = {id: drop.id, priority: 2500, name:"collect_dropped_energy"};
            Memory.new_tasks.dropped_energy.push(queue_task);
        }
    }
    
    for (let i = 0; i < Memory.new_tasks.dropped_energy.length; i++) {
        let queue_task = Memory.new_tasks.dropped_energy[i];
        let resource = Game.getObjectById(queue_task.id);
        if (!resource) {
            log.info("Finished resource task", queue_task);
            Memory.new_tasks.dropped_energy.splice(i, 1);
            i--;
        }
    }
}


function collectDroppedEnergy(creep) {
    let resource = Game.getObjectById(creep.memory.task.id);
    if (!resource) {
        return false;
    }
    if(resource.amount > 0 && creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0){
        creep.collectDroppedResource(resource);
        return true;
    } else {
        return false;
    }
}

function take(creep, queue_task) {
    if (!queue_task) return null;
    var F = function() {};
    F.prototype = queue_task;
    let creep_task = new F();
    queue_task.priority = 0;
    
    log.error("TCDE 48", creep_task.name);
    
    return creep_task;
}


module.exports = {
    task: task,
    updateQueue: updateQueue,
    take: take,
};