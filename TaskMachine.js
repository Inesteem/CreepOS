/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('TaskMachine');
 * mod.thing == 'a thing'; // true
 */
var task = require("Task");

 
var createBuildTasks = function(){
    structures = Game.rooms["W18S6"].find(FIND_MY_CONSTRUCTION_SITES);
    _.sortBy(structures, (structure) => - structure.progress);
    
    if(structures.length){
        //var bulid_task = task.createBuildTask(structures[0].id);
        Memory.tasks.push({name: "build", structure_id: structures[0].id});
    }
    
}
 

module.exports = {
    createBuildTasks:createBuildTasks,
};