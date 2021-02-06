import { error } from "./Logging"




Object.defineProperty(Source.prototype, 'memory', {
    //configurable: true,
    get: function() {
        let self = this;
        if(!Memory.sources) {
            Memory.sources = {};
        }
        if(typeof Memory.sources !== 'object') {
            return undefined;
        }
        return Memory.sources[self.id] = 
                Memory.sources[self.id] || {};
    },
    set: function(value) {
        let self = this;
        if(!Memory.sources) {
            Memory.sources = {};
        }
        if(typeof Memory.sources !== 'object') {
            throw new Error('Could not set source memory');
        }
        Memory.sources[self.id] = value;
    }
});

Object.defineProperty(Source.prototype, 'reservedSlots', {
    get: function () {
        let self = this;
        if (self._reservedSlots == undefined) {
            if (self.memory.reservedSlots == undefined) {
                self.memory.reservedSlots = [];
            } else {
                self.memory.reservedSlots = self.memory.reservedSlots.filter((slot) => Game.time < slot);
            }
            self._reservedSlots = self.memory.reservedSlots;
        }
        return self._reservedSlots;
    },
    set: function (value) {
        let self = this;
        if (self._reservedSlots === undefined) {
            self.memory.reservedSlots=value;
        }
    },
    //configurable: true
});

Source.prototype.reserveSlot = function(arrival_time){
    this.reservedSlots.push(arrival_time);
    this.reservedSlots.sort();
}

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

