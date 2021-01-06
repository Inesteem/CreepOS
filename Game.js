import { error } from "./Logging";
import "./Room";

var findEnemyCreeps = function(rooms, filter) {
    let enemies = {'all' : [], 'remote_fighters' : [], 'close_fighters' : [], 'healers' : []};
    for (let room of rooms ) {
        let room_enemies = room.findAllHostileCreeps();
        enemies.all             = enemies.all.concat(room_enemies.all);
        enemies.remote_fighters = enemies.remote_fighters.concat(room_enemies.remote_fighters);
        enemies.close_fighters  = enemies.close_fighters.concat(room_enemies.close_fighters);
        enemies.healers         = enemies.healers.concat(room_enemies.healers);
    }
    return enemies;
}

var numCreeps = function(filter) {
    if (typeof filter !== 'function') {
        error("base.numCreeps: filter is not a function.");
        return 0;
    }
    return Game.creeps.values().filter((creep) => filter(creep)).length;
}

export { numCreeps, findEnemyCreeps };