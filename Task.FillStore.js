var tasks = require("Task");

var task = new tasks.Task("fill_store", null);

task.state_array = [
    new tasks.State(tasks.harvestClosest),
    new tasks.State(tasks.fillStore),
]

module.exports = {
    task: task,
};