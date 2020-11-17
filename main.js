var creep_actions = require("CreepActions");

var harvest_id = "harvesting";
var upgrade_id = "upgrading";
var store_id = "storing";
var build_id = "building";


var fillSpawn = function(creep) {
    if (!creep.memory.state){
        creep.memory.state = harvest_id;
        creep.memory.source_id = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE).id;
    }
    if (creep.memory.state == harvest_id && creep.store.getFreeCapacity() == 0) {
        creep.memory.state = store_id;
    } else if (creep.memory.state == store_id && 
            (creep.store[RESOURCE_ENERGY] == 0 ||
             Game.spawns['Spawn1'].store.getFreeCapacity(RESOURCE_ENERGY)== 0)) {
        creep.memory.source_id = null;
        creep.memory.state = null;
        return false;
    }

    if(creep.memory.state == harvest_id ) {
        if (!creep.memory.source_id)
            creep.memory.source_id = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE).id;
        creep.harvestFrom(Game.getObjectById(creep.memory.source_id));
    }
    else {
        var spawn = Game.spawns["Spawn1"];
        creep.storeAt(spawn);
    }   
    return true;
}

var upgradeController = function (creep){
    if(!creep.memory.state) creep.memory.state = harvest_id;
    if (creep.memory.state == harvest_id && creep.store.getFreeCapacity() == 0)
        creep.memory.state = upgrade_id;

    else if (creep.memory.state == upgrade_id  && creep.store[RESOURCE_ENERGY] == 0){
        creep.memory.state = null;
        return false;
    }

    if(creep.memory.state == harvest_id ) {
        creep.harvestClosest();
    }
    else {
        creep.upgrade();
    }   
    return true;
}

var buildClosest = function (creep){
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            Game.spawns['Spawn1'].spawnCreep([WORK,CARRY, MOVE], Memory.creeps[name]);
        }
    }

    if(!creep.memory.state) creep.memory.state = harvest_id;
    if (creep.memory.state == harvest_id && creep.store.getFreeCapacity() == 0) {
        creep.memory.structure_id = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES).id;
        creep.memory.state = build_id;
    }
    if (creep.memory.state == build_id  && 
            (!creep.memory.structure_id || creep.store[RESOURCE_ENERGY] == 0
             || Game.getObjectById(creep.memory.structure_id).progress ==
             Game.getObjectById(creep.memory.structure_id).progressTotal)){
        creep.memory.state = null;
        creep.memory.structure_id = null;
        return false;
    }

    if(creep.memory.state == harvest_id ) {
        creep.harvestClosest();
    }
    else {
        if (!creep.memory.structure_id)
            creep.memory.structure_id = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES).id;
        creep.buildStructure(Game.getObjectById(creep.memory.structure_id));
    }   
    return true;
}


module.exports.loop = function () {
    console.log(JSON. stringify(Memory.tasks));
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            if (Memory.creeps[name].task)
                Memory.tasks.push(Memory.creeps[name].task);
            delete Memory.creeps[name];
        }
    }

    if (_.filter(Game.creeps, (creep) => true).length < 7) {
        var newName = "Kevin" + Game.time;
        Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], newName);
    }

    var task_mapping = {
        'fill_spawn': fillSpawn,
        'upgrade': upgradeController,
        'build': buildClosest
    };

    _.forEach(Game.creeps, (creep) => {
        if (!creep.memory.task) {
            creep.memory.task = Memory.tasks.shift();
        } else {
            if(!task_mapping[creep.memory.task](creep)){
                Memory.tasks.push(creep.memory.task);
                creep.memory.task = null;
            }
        }
    });

}


