import { Task, State, harvestClosest, fillStore } from "./Task";
import { error } from "./Logging";

var task = new Task("fill_store", null);

task.state_array = [
    new State(harvestClosest),
    new State(fillStore),
]

export {task};