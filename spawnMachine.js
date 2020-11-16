var spawnMachine = {

    getAvailableEnergy: function(){

        var energyAvailable = Game.spawns['Spawn1'].energy;
        _.filter(Game.structures, function(structure){
            if (structure.structureType == STRUCTURE_EXTENSION){
                energyAvailable += structure.energy;
            }
        });    
        return energyAvailable;

    },

    getMaxAvailableEnergy: function() {
        return Game.rooms.W8N4.energyCapacityAvailable;
    },

    bodyCost: function (body) {
        return body.reduce(function (cost, part) {
            return cost + BODYPART_COST[part];
        }, 0);
    },

    /** @param {Creep} creep **/
    spawnWorker: function(roleName, num, attrs) {
        var workers = _.filter(Game.creeps, (creep) => creep.memory.role == roleName);
        //console.log(roleName + ': ' + workers.length);
        var avEn = this.getAvailableEnergy();
        var neEn = this.bodyCost(attrs);
        if(workers.length < num) {
            if(avEn < neEn){
                console.log("NOT ENOUGH ENERGY for " + roleName + ' ' + avEn + "/" + neEn + "   " + this.getMaxAvailableEnergy());
            } else {
                var newName = roleName + Game.time;
                console.log('Spawning new '+roleName+': ' + newName);
                Game.spawns['Spawn1'].spawnCreep(attrs, newName,
                        {memory: {role: roleName}});
            }
        }

    }

};

//                                                                                                                                                                        module.exports = spawnMachine;
