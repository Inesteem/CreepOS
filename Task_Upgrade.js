import { QueueTask, CreepTask, Task, State, takeFromStore, upgradeController, getEnergyForTask } from "./Task";
import { getOurRooms } from "./Base";
import {error} from "./Logging";

var task = new Task("upgrade", null);

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
    for (let i = 0; i < Memory.new_tasks.upgrade.length; i++) {
        let upgrade_task = Memory.new_tasks.upgrade[i];
        controller = Game.getObjectById(upgrade_task.id);
        if (!controller || !controller.my) {
            Memory.new_tasks.upgrade.splice(i, 1);
            i--;
        }
    }
}
/**
 * @param {Creep} creep
 * @param {QueueTask} queue_task 
 * @return {CreepTask}
 */
task.take = function(creep, queue_task) {
    queue_task.priority = 500;
    let creep_task = {};
    
    Object.assign(creep_task, getEnergyForTask(creep, queue_task).task);
    creep_task.id = queue_task.id;
    creep_task.name = queue_task.name;
    
    return creep_task;
}

task.state_array = [
    new State(takeFromStore),
    new State(upgradeController),
];


export {task};
