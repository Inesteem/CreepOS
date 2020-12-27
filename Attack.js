/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Attack');
 * mod.thing == 'a thing'; // true
 */
var base = require("Base");


    //const target = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    
var kite = function(creep){
    let enemies = [];
    let rooms = base.getOurRooms();
    rooms.push(creep.room);
    
    rooms.forEach(room => {
       enemies = enemies.concat(room.find(FIND_HOSTILE_CREEPS));
    });
    
    const target = creep.pos.findClosestByRange(enemies);
    if (!target) return false;
    if (creep.pos.inRangeTo(target.pos, 2)) {
        creep.moveAwayFrom(target, 3);
    } else {
        creep.shoot(target);
    }
    
    return true;
};

module.exports = {
    kite : kite,
};