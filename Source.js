import { error } from "./Logging"

Source.prototype.hasFreeSpot = function(){
    error (this.pos.getAdjacentWalkables());
    error (this.pos.getAdjacentWalkables().length > 0);
    return (this.pos.getAdjacentWalkables().length > 0);
}