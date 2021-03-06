import { error, info } from "../Logging"




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
    let rate = 0; 
    //time that a creep may wait at a source for a free spot
    for (let slot of this.reservedSlots){
        //since the list is sorted with respect to the arrival time,
        //we can finish counting if the arrival time of the current slot
        //is way after the finish_time 
        if(slot.arrival > finish_time) break;
        //count only slots that interfere with the creeps arrival time
        if(slot.finish > arrival_time){
            let start_time = Math.max(arrival_time, slot.arrival);
            let end_time = Math.min(slot.finish, finish_time);
            let slot_time = slot.finish-slot.arrival;
            let time = finish_time-arrival_time;
            rate += (slot.energy / slot_time) * ((end_time-start_time)/time);
            ++takenSpots;
        }
    }

    const max_rate = 10;

   info("slots: ", takenSpots , " / ", spots, "rate:   ", rate, " / ", max_rate);
   return (spots>takenSpots) && (rate < max_rate);
}

Source.prototype.reserveSlot = function(arrival_time, finish_time, energy){
    this.reservedSlots.push({arrival : arrival_time, finish : finish_time, energy : energy});
    this.reservedSlots.sort((a,b) => a.arrival - b.arrival);
}

Source.prototype.hasFreeSpot = function(){
    return (this.pos.getAdjacentWalkables().length > 0);
}

Source.prototype.hasMiner = function(){
    return this.memory.miner && Game.creeps[this.memory.miner];
}