import { error } from "./Logging"

Source.prototype.hasFreeSpot = function(){
    return (this.pos.getAdjacentWalkables().length > 0);
}

Source.prototype.hasMiner = function(){
    return Memory.reservedSources && Memory.reservedSources[this.id] > 0;
}

Source.prototype.reserveSource = function() {
    Memory.reservedSources = Memory.reservedSources || {};
    Memory.reservedSources[this.id] = Memory.reservedSources[this.id] || 0;
    Memory.reservedSources[this.id] += 1;
}

Source.prototype.freeSource = function() {
    Memory.reservedSources = Memory.reservedSources || {};
    Memory.reservedSources[this.id] = Memory.reservedSources[this.id] || 1;
    Memory.reservedSources[this.id] -= 1;
}

