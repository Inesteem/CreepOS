/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Attack');
 * mod.thing == 'a thing'; // true
 */
var base = require("Base");
var constants = require("Constants");
var spawn_machine = require("SpawnMachine");
var game = require("Game");

// Detects whether safe mode needs to be activated in any of our rooms and activates it.
// If a room has enemies but no safe mode, spawns defenders.
function monitor() {
    const rooms = base.getOurRooms();
    const enemies = game.findEnemyCreeps(rooms, (creep) => true);
    for (let enemy of enemies.all) {
        let room = enemy.room;
        if (!room.controller.safeMode
                && !room.controller.safeModeCooldown
                && room.controller.safeModeAvailable) {
            room.controller.activateSafeMode();
        }
        else if (!room.controller.safeMode &&
            _.filter(Game.creeps, (creep) => creep.memory.role == constants.Role.ARCHER).length < 2) {
            spawn_machine.spawnArcher();
        }
    }
}
    
var kite = function(creep){
    const rooms = base.getOurRooms();
    const enemies = base.findEnemyCreeps(rooms, (creep) => true);
    
    const target = creep.pos.findClosestByRange(enemies);
    if (!target) return false;
    if (!target.room.controller.safeMode && creep.pos.inRangeTo(target.pos, 2) && target.getActiveBodyparts(ATTACK)) {
        creep.moveAwayFrom(target, 3);
    } else {
        creep.shoot(target);
    }
    
    return true;
};

module.exports = {
    kite : kite,
    monitor: monitor,
};