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
        Game.spawns['Spawn1'].spawnCreep(body, newName);
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
    if (Game.spawns['Spawn1'].spawnCreep(body, newName) == 0)
        Game.creeps[newName].memory.miner = true;
}

function allowSpawn(body) {
    var num_creeps = _.filter(Game.creeps, (creep) => true).length;
    var body_cost = bodyCost(body);
    var max_cost = Game.rooms['W18S6'].energyCapacityAvailable;
    //console.log("Checking spawn")
    //console.log(body_cost);
    //console.log(Math.max(max_cost,num_creeps * num_creeps + 300));
    return body_cost >= Math.min(max_cost - 50,num_creeps * num_creeps + 300);
}

function bodyCost(body) {
    let sum = 0;
    for (let i in body)
        sum += BODYPART_COST[body[i]];
    return sum;
}


module.exports = {
    spawnCreep : spawnCreep,
    spawnMiner : spawnMiner
};