import { error } from "../Logging"




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
                self.memory.reservedSlots = self.memory.reservedSlots.filter((slot) => Game.time < slot.finish);
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


Source.prototype.hasFreeSlot = function(arrival_time, finish_time, energy){
    let spots = this.pos.getAdjacentGenerallyWalkables().length; 
    let takenSpots = 0;//spots - this.pos.getAdjacentWalkables().length;
    
    //time that a creep may wait at a source for a free spot
    let ok_wait_time = 0;
    
    for (let slot of this.reservedSlots){
        //since the list is sorted with respect to the arrival time,
        //we can finish counting if the arrival time of the current slot
        //is way after the finish_time 
        if(slot.arrival > (finish_time - ok_wait_time)) break;
        //count only slots that interfere with the creeps arrival time
        if(slot.finish > (arrival_time + ok_wait_time)) 
            ++takenSpots;
    }
    error(takenSpots , " / ", spots);
   return spots>takenSpots;
}

Source.prototype.reserveSlot = function(arrival_time, finish_time, energy){
    this.reservedSlots.push({arrival : arrival_time, finish : finish_time, energy : energy});
    this.reservedSlots.sort((a,b) => a.arrival - b.arrival);
}

Source.prototype.hasFreeSpot = function(){
    return (this.pos.getAdjacentWalkables().length > 0);
}

Source.prototype.hasMiner = function(){
    return Memory.reservedSources && Memory.reservedSources[this.id] && Memory.reservedSources[this.id] > 0;
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

