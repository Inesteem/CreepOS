var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');

var spawnMachine = require('spawnMachine');

if (!Creep.prototype.harvestNearest) {
    console.log("new function");
    Creep.prototype.harvestNearest = function() {
        var src = this.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
        if(this.harvest(src) == ERR_NOT_IN_RANGE) {
            this.moveTo(src, {visualizePathStyle: {stroke: '#ffaa00'}});
        }
    };
} 

var workers = [
{"name":'harvester',    "num":3,"body":[WORK,CARRY,MOVE,MOVE,MOVE,MOVE]},
{"name":'builder',      "num":3,"body":[WORK,CARRY,MOVE,MOVE,MOVE,MOVE]},
{"name":'upgrader',     "num":6,"body":[WORK,CARRY,MOVE,MOVE,MOVE,MOVE]}
];

module.exports.loop = function () {

    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }


    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if(creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
        }
        if(creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
        if(creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        }
    }

    for (var i in workers) {
        spawnMachine.spawnWorker(workers[i].name, workers[i].num, workers[i].body);
    }
}




