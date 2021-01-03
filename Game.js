Game.prototype.findEnemyCreeps = function(rooms, filter) {
    let enemies = {'enemies' : [], 'remote_fighters' : [], 'close_fighters' : [], 'healers' : []};
    for (room of rooms ) {
        let room_enemies = room.findAllHostileCreeps();
        enemies.all             = enemies.all.concat(room_enemies.all);
        enemies.remote_fighters = enemies.remote_fighters.concat(room_enemies.remote_fighters);
        enemies.close_fighters  = enemies.close_fighters.concat(room_enemies.close_fighters);
        enemies.healers         = enemies.healers.concat(room_enemies.healers);
    }
    return enemies;
}

Game.prototype.numCreeps = function(filter) {
    if (typeof filter !== 'function') {
        log.error("base.numCreeps: filter is not a function.");
        return 0;
    }
    return _.filter(this.creeps, (creep) => filter(creep)).length;
}