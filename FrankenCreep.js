import { error } from "./Logging";

/**
 * A fake creep.
 * @constructor
 * @extends Creep
 * @param {!RoomPosition} pos 
 * @param {!Array<string>} body_parts 
 * @param {!string} name 
 */
function Frankencreep(pos, body_parts, name) {
    this.pos = pos;
    this.name = name;
    this.room = Game.rooms[pos.roomName];
    Memory.creeps = Memory.creeps || {};
    Memory.creeps[name] = Memory.creeps[name] || {};
    this.memory = Memory.creeps[name];
    this.body = body_parts.map(part => { return {type: part, boost: "", hits: 1000}; });
    this.getActiveBodyparts = (part) => body_parts.filter(x => x==part).length;
    this.store = /** @type Store */ ({energy: 0, 
        getCapacity: (energy) => {return body_parts.filter(x => x == CARRY).length * 50;},
        getFreeCapacity: (energy) => { return body_parts.filter(x => x == CARRY).length * 50;}});

    this.findOptimalEnergy = Creep.prototype.findOptimalEnergy;
    this.getCostMatrix = Creep.prototype.getCostMatrix;
    this.getRoadCosts = Creep.prototype.getRoadCosts;
    this.getPlainCosts = Creep.prototype.getPlainCosts;
    this.getSwampCosts = Creep.prototype.getSwampCosts;
    this.say = (msg) => error( "say ", msg);
};

export { Frankencreep }