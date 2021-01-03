var tasks = require("Task");

var task = new tasks.Task("claim_room", null);

task.state_array = [
    new tasks.State(tasks.claimRoom),    
]

module.exports = {
    task: task
};