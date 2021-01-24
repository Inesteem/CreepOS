import { error } from "./Logging"

Source.prototype.hasFreeSpot = function(){
    return (this.pos.getAdjacentWalkables().length > 0);
}