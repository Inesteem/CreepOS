import { Task, State, takeFromStore, upgradeController } from "./Task";
import { getOurRooms } from "./Base";

var task = new Task("upgrade", null);

task.state_array = [
    new State(takeFromStore),
    new State(upgradeController),
];

task.updateQueue = () => {
    let controller = [];
    let rooms = getOurRooms();
    
    rooms.forEach(room => {
        controller.push(room.controller);
    });
    
    Memory.new_tasks.upgrade = Memory.new_tasks.upgrade || [];
    for (let structure of controller) {
        if (!Memory.new_tasks.upgrade.find(controller_task => controller_task.id == structure.id)) {
            Memory.new_tasks.upgrade.push({id: structure.id, priority: 500, name:"upgrade"});
        }
    }
    
    // TODO when to delete?
}

task.take = function(creep, queue_task) {
//    let structure = Game.getObjectById(queue_task.id);
    
//    if (!structure) return null;
    queue_task.priority = 500;
    queue_task.add_priority = 2;
    let creep_task = {};
    
    Object.assign(creep_task, tasks.getEnergyForTask(creep, queue_task).task);
    
    Object.assign(creep_task, queue_task);
    
    return creep_task;
    
}

var task = new tasks.Task("upgrade", null);

task.state_array = [
    new tasks.State(tasks.takeFromStore),
    new tasks.State(tasks.upgradeController),
];

export {task};
