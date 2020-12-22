/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('SpawnMachine');
 * mod.thing == 'a thing'; // true
 */
 
 

var spawnCreep = function(){
    var newName = "Kevin" + Game.time;
    
    var parts = [WORK, CARRY, MOVE];
    var body = [WORK, CARRY, MOVE];
    var idx = 0;
    
    while(Game.spawns['Spawn1'].spawnCreep(body, newName , { dryRun: true }) == 0){
        body.push(parts[idx]);
        idx = (idx + 1) % parts.length;
    }
    body.pop();
    var kevin_parts = [CARRY, MOVE];
    idx=0;
    while(Game.spawns['Spawn1'].spawnCreep(body, newName , { dryRun: true }) == 0){
        body.push(kevin_parts[idx]);
        idx = (idx + 1) % kevin_parts.length;
    }
    body.pop();
    //console.log("spawned kevin with body " + JSON.stringify(body));
    if(allowSpawn(body))
        Game.spawns['Spawn1'].spawnCreep(body, newName, {memory: {role: "Worker"}});
}

var spawnMiner = function(){
    var newName = "Lars" + Game.time;
    
    var parts = [WORK];
    var body = [WORK, CARRY, MOVE, WORK, WORK];
    var idx = 0;
    
    while(Game.spawns['Spawn1'].spawnCreep(body, newName , { dryRun: true }) == 0){
        body.push(parts[idx]);
        idx = (idx + 1) % parts.length;
    }
    body.pop();
    if(!allowSpawn(body)) return;
    Game.spawns['Spawn1'].spawnCreep(body, newName, {memory: {role: "Miner"}});
}

var spawnScout = function() {
    let newName = "Scouty";
    let body = [MOVE, CLAIM];
    Game.spawns['Spawn1'].spawnCreep(body, newName, {memory: {role: "Scout"}});
}

function spawnArcher() {
    let newName = "Legolas" + Game.time;
    let parts = [MOVE, RANGED_ATTACK];
    let body = [MOVE, RANGED_ATTACK];
    
    let idx = 0;
    while(Game.spawns['Spawn1'].spawnCreep(body, newName , { dryRun: true }) == 0){
        body.push(parts[idx]);
        idx = (idx + 1) % parts.length;
    }
    body.pop();
    if (body.length > 1)
        Game.spawns['Spawn1'].spawnCreep(body, newName, {memory: {role: "Archer"}});
}


function allowSpawn(body) {
    var num_creeps = _.filter(Game.creeps, (creep) => true).length;
    var max_cost = Game.spawns['Spawn1'].room.energyCapacityAvailable;
    var energy = Game.spawns['Spawn1'].room.energyAvailable;
    return energy >= Math.min(max_cost, num_creeps * num_creeps + 300);
}

function bodyCost(body) {
    let sum = 0;
    for (let i in body)
        sum += BODYPART_COST[body[i]];
    return sum;
}


module.exports = {
    spawnCreep : spawnCreep,
    spawnMiner : spawnMiner,
    spawnScout: spawnScout,
    spawnArcher: spawnArcher
};