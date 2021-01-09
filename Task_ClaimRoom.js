import {  QueueTask, CreepTask, Task, State, claimRoom } from "./Task";
import { error } from "./Logging";

var task = new Task("claim_room", null);

task.state_array = [
    new State(claimRoom),    
]

export {task};