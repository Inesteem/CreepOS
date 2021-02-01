import { Role, MAX_WORKER_NUM, MAX_MINER_NUM, MAX_SCOUT_NUM } from "./Constants";
import { info, error } from "./Logging";
import { getUnclaimedFlags, getRoomsToClaim } from "./Base";
import "./Room";
import "./Game";
import { getBiggestSpawn, numCreeps } from "./Game";
import { getCreepBody as getSlayerBody } from  "./Task/Task_Attack_SourceKeeper";


function getMaxMinerNum(room) {

    var sources = room.find(FIND_SOURCES);
    let max_miner_num = 0;

    for (let source of sources){
        max_miner_num += Math.min(1,source.pos.getAdjacentWalkables().length);
    }
    return max_miner_num;

}

function monitor() {
    var scout_num = numCreeps((creep) => creep.memory.role == Role.SCOUT);
    var to_claim = getUnclaimedFlags().length > 0;
    for (let room of Game.getOurRooms()) {
        //var mom_worker_num = numCreeps((creep) => creep.memory.role == Role.WORKER && creep.room === room);
        var mom_miner_num = numCreeps((creep) => creep.memory.role == Role.MINER && creep.room === room);
        var max_miner_num = getMaxMinerNum(room);
        let spawns = room.getSpawns();
        for (let spawn of spawns) {
            //if (mom_worker_num < MAX_WORKER_NUM) {
            //    info("Attempting to spawn worker: " + mom_worker_num + " vs " + MAX_WORKER_NUM);
                //if(spawn.spawnKevin() === OK) continue;
            //}
            // if (getNoOwnerStructures(room, STRUCTURE_CONTAINER).length > 0 && mom_miner_num < max_miner_num) {
            //     info("Attempting to spawn miner: " + mom_miner_num + " vs " + max_miner_num);
            //     if(spawn.spawnMiner() === OK) continue;
            // }
            if (to_claim && scout_num < MAX_SCOUT_NUM) {
                if (spawn.spawnScout() === OK) scout_num += 1;
            }
        }
    }
    
    let rooms_to_claim = getRoomsToClaim();
    for (let room of rooms_to_claim) {
        let source_keeper_lairs = room.find(FIND_HOSTILE_STRUCTURES, {
            filter : {structureType: STRUCTURE_KEEPER_LAIR}
        });
        if (source_keeper_lairs.length > 0){
            var slayer_num = numCreeps((creep) => creep.memory.role == Role.SLAYER && creep.room === room);
            if (slayer_num < 1){
                getBiggestSpawn().spawnSlayer();
            }
        }
    }
}


/**
 * @return {number} OK on success, ERR on failure
 */
StructureSpawn.prototype.spawnSlayer= function () {
    var newName = "Ulf" + Game.time;
    let body = getSlayerBody();

    if (this.allowSpawn())
        return this.spawnCreep(body, newName, { memory: { role: Role.SLAYER} });
    return ERR_NOT_ENOUGH_ENERGY;
}



/**
 * @return {string} The name.
 */
StructureSpawn.prototype.spawnKevin = function () {
    var newName = "Kevin" + Game.time;

    var parts = [WORK, CARRY, MOVE];
    var body = [WORK, CARRY, MOVE];
    var idx = 0;

    while (this.spawnCreep(body, newName, { dryRun: true }) == 0) {
        body.push(parts[idx]);
        idx = (idx + 1) % parts.length;
    }
    body.pop();
    var kevin_parts = [CARRY, MOVE];
    idx = 0;
    while (this.spawnCreep(body, newName, { dryRun: true }) == 0) {
        body.push(kevin_parts[idx]);
        idx = (idx + 1) % kevin_parts.length;
    }
    body.pop();
    //console.log("spawned kevin with body " + JSON.stringify(body));

    if (this.allowSpawn()) {
        this.spawnCreep(body, newName, { memory: { role: Role.WORKER } });
        return newName;
    }
    return "";
}

/**
 * @return {string} The name.
 */
StructureSpawn.prototype.spawnMiner = function () {
    var newName = "Lars" + Game.time;

    var parts = [WORK];
    var body = [WORK, CARRY, MOVE, WORK, WORK];
    var idx = 0;

    while (this.spawnCreep(body, newName, { dryRun: true }) == 0) {
        body.push(parts[idx]);
        idx = (idx + 1) % parts.length;
        if (body.length > 8) break;
    }
    
    body.pop();

    if (this.allowSpawn() && this.spawnCreep(body, newName, { memory: { role: Role.MINER } }) === OK) {
        return newName;
    }
    return "";
}

/**
 * @return {number} OK on success, ERR on failure
 */
StructureSpawn.prototype.spawnScout = function () {
    var newName = "Scouty" + Game.time;

    var body = [CLAIM, MOVE, MOVE];

    if (body.length >= 2)
        return this.spawnCreep(body, newName, { memory: { role: Role.SCOUT } });
    return ERR_NOT_ENOUGH_ENERGY;
}

/**
 * @return {number} OK on success, ERR on failure
 */
StructureSpawn.prototype.spawnArcher = function () {
    error("spawning archer");
    let newName = "Legolas" + Game.time;
    let parts = [MOVE, MOVE, RANGED_ATTACK];
    let body = [MOVE, RANGED_ATTACK];

    let idx = 0;
    while (this.spawnCreep(body, newName, { dryRun: true }) == 0) {
        body.push(parts[idx]);
        idx = (idx + 1) % parts.length;
    }
    body.pop();
    if (body.length <= 1) return ERR_NOT_ENOUGH_ENERGY;

    while (this.spawnCreep(body, newName, { dryRun: true }) == 0) {
        body.unshift(TOUGH);
        idx = (idx + 1) % parts.length;
    }
    body.shift();

    return this.spawnCreep(body, newName, { memory: { role: Role.ARCHER } });
}

/**
 * @param {Room} room The room in which to spawn an archer
 * @return {number} OK on success, ERR on failure
 */
function spawnArcherInRoom(room) {
    let spawns = room.getSpawns()
    if (spawns.length > 0)
        return spawns[0].spawnArcher();
    return -1;//TODO: error
}

/**
 * @return {boolean} true if enough energy is available to spawn a 'good enough' creep 
 */
StructureSpawn.prototype.allowSpawn = function () {
    var num_creeps = numCreeps();
    var max_cost = this.room.energyCapacityAvailable;
    var energy = this.room.energyAvailable;
    let energy_req = num_creeps * num_creeps * num_creeps + 300;
    info("spawn requires energy: ", Math.min(max_cost, energy_req), " we have ", energy, " at ", this.room);
    return energy >= Math.min(max_cost, energy_req);
}
export { monitor, spawnArcherInRoom };