 import { Role, MAX_WORKER_NUM, MAX_MINER_NUM } from "./Constants";
 import { info } from "./Logging";
 import { numCreeps, getNoOwnerStructures } from "./Base";
 
function monitor() {
    var mom_worker_num = numCreeps((creep) => creep.memory.role == Role.WORKER);
    var mom_miner_num  = numCreeps((creep) => creep.memory.role == Role.MINER);
    // TODO archers are spawned by Defense module, is that a good idea?
    var mom_archer_num  = numCreeps((creep) => creep.memory.role == Role.ARCHER);
    
    if (mom_worker_num < MAX_WORKER_NUM) {
        info("Attempting to spawn worker: " +mom_worker_num +" vs " + MAX_WORKER_NUM);
        spawnCreep();
    }
    else if (getNoOwnerStructures(Game.spawns['Spawn1'].room, STRUCTURE_CONTAINER).length > 0
            && mom_miner_num < MAX_MINER_NUM) {
        spawnMiner();
        info("Attempting to spawn miner: " + mom_miner_num +" vs " + MAX_MINER_NUM);
    }
}

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
        return Game.spawns['Spawn1'].spawnCreep(body, newName, {memory: {role: Role.WORKER}});
    return ERR_NOT_ENOUGH_ENERGY;
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
    
    if(allowSpawn(body)) 
        return Game.spawns['Spawn1'].spawnCreep(body, newName, {memory: {role: Role.MINER}});
    return ERR_NOT_ENOUGH_ENERGY;
}

var spawnScout = function() {
    let newName = "Scouty";
    let body = [MOVE, CLAIM];
    Game.spawns['Spawn1'].spawnCreep(body, newName, {memory: {role: Role.SCOUT}});
}

function spawnArcher() {
    let newName = "Legolas" + Game.time;
    let parts = [MOVE, MOVE, RANGED_ATTACK];
    let body = [MOVE, RANGED_ATTACK];
    
    let idx = 0;
    while(Game.spawns['Spawn1'].spawnCreep(body, newName , { dryRun: true }) == 0){
        body.push(parts[idx]);
        idx = (idx + 1) % parts.length;
    }
    body.pop();
    if (body.length <= 1) return;
    
    while(Game.spawns['Spawn1'].spawnCreep(body, newName , { dryRun: true }) == 0){
        body.unshift(TOUGH);
        idx = (idx + 1) % parts.length;
    }
    body.shift();
    
    return Game.spawns['Spawn1'].spawnCreep(body, newName, {memory: {role: Role.ARCHER}});
}


function allowSpawn(body) {
    var num_creeps = Game.creeps.value().filter((creep) => true).length;
    var max_cost = Game.spawns['Spawn1'].room.energyCapacityAvailable;
    var energy = Game.spawns['Spawn1'].room.energyAvailable;
    info("spawn requires energy: ", Math.min(max_cost, num_creeps * num_creeps + 300), " we have ", energy);
    return energy >= Math.min(max_cost, num_creeps * num_creeps + 300);
}


export { spawnCreep, spawnMiner, spawnScout, spawnArcher, monitor};