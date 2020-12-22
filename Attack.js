/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Attack');
 * mod.thing == 'a thing'; // true
 */



    //const target = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    
var kite = function(creep){
    
    const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if (!target) return;
    if (creep.pos.inRangeTo(target.pos, 2)) {
        let dir = (((creep.pos.getDirectionTo(target)-1) + 3 + Math.floor(Math.random() * 3) ) % 8) + 1;
        
        const look = creep.room.lookForAtArea(LOOK_TERRAIN,
            creep.pos.x-1,
            creep.pos.y-1,
            creep.pos.x+1,
            creep.pos.y+1);
            
        console.log(JSON.stringify(look));
        
        creep.move(dir);
    } else {
        creep.shoot(target);
    }
    
};
module.exports = {
    kite : kite,
};