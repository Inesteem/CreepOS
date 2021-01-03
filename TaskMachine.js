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

var build_tasks = require("TaskMachine.BuildTasks");

// TODO change to new task format and all that.
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