

Room.prototype.findAllHostileCreeps = function (){

    let enemies = this.find(FIND_HOSTILE_CREEPS);
    let remote_fighters =   enemies.filter(enemy => enemy.getActiveBodyparts(RANGED_ATTACK));                                                      
    let close_combatants =  enemies.filter(enemy => enemy.getActiveBodyparts(ATTACK));                                                          
    let healers =           enemies.filter(enemy => enemy.getActiveBodyparts(HEAL));   

    return {'all' : enemies, 'remote_fighters' : remote_fighters, 'close_fighters' : close_combatants, 'healers' : healers};
}


Room.prototype.numCreeps = function(filter) {
    if (typeof filter !== 'function') {
        log.error("base.numCreeps: filter is not a function.");
        return 0;
    }
    return _.filter(Game.creeps, (creep) => filter(creep) && creep.room === this ).length;
}
