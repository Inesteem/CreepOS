

Room.prototype.findAllHostileCreeps = function (){

    let enemies = this.find(FIND_HOSTILE_CREEPS);
    let remote_fighters =   enemies.filter(enemy => enemy.getActiveBodyparts(RANGED_ATTACK));                                                                 constants.PARALLEL_ROAD_BUILD_NUM];
    let close_combatants =  enemies.filter(enemy => enemy.getActiveBodyparts(ATTACK));                                                                 constants.PARALLEL_ROAD_BUILD_NUM];
    let healers =           enemies.filter(enemy => enemy.getActiveBodyparts(HEAL));                                                                 constants.PARALLEL_ROAD_BUILD_NUM];

    return {'all' : enemies, 'remote_fighters' : remote_fighters, 'close_fighters' : close_combatants, 'healers' : healers};
}
