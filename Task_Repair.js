import { State, takeFromStore, Task } from "./Task";
import { info, error} from "./Logging";
import { getOurRooms } from "./Base";


/**
 * @constructor 
 */
function RepairTask(){
    this.state_array = [
        new State(takeFromStore),
        new State(repairStructure),
    ];
}

function repairStructure(creep) {
    let structure = Game.getObjectById(creep.memory.task.id);
    
    if(!structure){
        return false;
    }
    
    creep.repairStructure(structure);
    
    if (creep.store[RESOURCE_ENERGY] == 0 ||
            structure.hits == structure.hitsMax) {
        return false;
    }
    return true;
}

RepairTask.prototype = new Task("repair", null);

var task = new RepairTask();

task.updateQueue = () => {
    let structures = [];
    let rooms = getOurRooms();
    
    rooms.forEach(room => {
       structures = structures.concat(room.find(FIND_STRUCTURES, {
            filter: object => object.hits && object.hits < object.hitsMax
        }));
    });

     Memory.new_tasks.repair = Memory.new_tasks.repair || [];
    for (let structure of structures) {
        if (!Memory.new_tasks.repair.find(repair_task => repair_task.id == structure.id)) {
            Memory.new_tasks.repair.push({id: structure.id, priority: 500, name:"repair"});
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
    info("Repair tasks: ", Memory.new_tasks.repair);
}

export {task};