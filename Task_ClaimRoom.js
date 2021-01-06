import { Task, State, claimRoom } from "./Task";

var task = new Task("claim_room", null);

task.state_array = [
    new State(claimRoom),    
]

export {task};