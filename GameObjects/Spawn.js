import { Frankencreep } from "../FrankenCreep";
import { error } from "../Logging";

/**
 * Spawns the best possible creep according to the eval function.
 * @param {function(Creep):number} eval_func Returns a number between 0 and INFINITY. 0 if the creep is unsuitable.
 * @param {string} name
 * @param {Object} memory
 * @return {number} OK if a creep is spawned, an error constant otherwise
 * @this {StructureSpawn}
*/
StructureSpawn.prototype.spawnWithEvalFunc = function(eval_func, name, memory) {
    if (this.spawning != undefined) {
        return ERR_BUSY;
    }
    error("Attempting to spawn", name);

    let parts = [WORK, CARRY, ATTACK, RANGED_ATTACK, HEAL, TOUGH, MOVE];
    let body = [MOVE, CARRY]; // TODO problem if more than one body part is required to have value...
    
    let best_value = 0;
    while (true) {
        let best_part = undefined;
        for (let part of parts){
            body.push(part);
            if (this.spawnCreep(body, name, { dryRun: true }) == OK) {
                let frankencreep = new Frankencreep(this.pos, body, name);
                let value = eval_func(frankencreep);
                if (value >= best_value) {
                    best_value = value;
                    best_part = part;
                }
                error(part, ": ", value, " - ", body);
            }
            body.pop();
        }
        if (best_part != undefined) {
            body.push(best_part);
        } else {
            break;
        }
    }
    if (best_value > 0) {
        return this.spawnCreep(body, name, {memory: memory});
    }
    return ERR_NOT_ENOUGH_ENERGY;
}