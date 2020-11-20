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
    var body = [WORK, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE];
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
    if(body.length < 7) return;
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
    if(body.length < 5) return;
    if (Game.spawns['Spawn1'].spawnCreep(body, newName) == 0)
        Game.creeps[newName].memory.miner = true;
}


module.exports = {
    spawnCreep : spawnCreep,
    spawnMiner : spawnMiner
};