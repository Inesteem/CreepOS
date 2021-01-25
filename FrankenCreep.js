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
    this.body = body_parts.map(part => { return {type: part, boost: "", hits: 1000}; });
    this.getActiveBodyparts = (part) => body_parts.filter(x => x==part).length;
    this.store = /** @type Store */ ({energy: 0, 
        getCapacity: (energy) => body_parts.filter(x => x==CARRY).length * 50,
        getFreeCapacity: (energy) => body_parts.filter(x => x==CARRY).length * 50});

    this.findOptimalEnergy = Creep.prototype.findOptimalEnergy;
    this.getCostMatrix = Creep.prototype.getCostMatrix;
    this.say = (msg) => error( "say ", msg);
};

export { Frankencreep }