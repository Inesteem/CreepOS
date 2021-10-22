# Closure Compiler
  - In make.json replace "js_module_root": "/path/to/CreepOS"
  - Run closure compiler
  - Copy main.js to your screeps folder

# Task Management 
  - Modules
    - TaskMachine
    - Task
    - Sc(h)eduler (SOON)
 
  - Task Types  
    - fill_structure (spawn, extension, tower, container, ...)
    - upgrade controller
    - build structure (with specific goal)
    - repair structure (with specific goal)
  
  - Priority/Efficacy Scheduling 
    - each creep chooses the next task depending on it's priority and 
    - the overall path length the creep needs to move to complete the task
  
  - TODO:
    - automatic task creation (you need to define the quantity of each task type in the main loop until now)

# (Semi-)Automatic Creep Management
  - Modules
    - SpawnMachine
  
  - Spawning 
    - starts with generous spawning (weak screeps using less energy to spawn) at the beginning (few creeps)
    - gets more demanding when more creeps are present (uses more body parts in the end if extensions are available)
    - ensures that creeps at least have one work, carry and move part 
   
  - Memory Freeing
    - clears memory of dead creeps 
    
  
# Basic Defending System 
  - Modules
    - Attack

  - Fighter Types
    - remote fighter (kiters)
    - close combatant (TODO ?)
    - tower (heal, attack)
  
  - Other Featuers
    - worker creeps try to escape
  
  - Automatic Fighter Spawning
    - when a hostile creep is detected, remote fighters are spawned
    
  - TODO: increase priority of extension/spawn filling

# Basic Tower Management
  - Modules
    - Tower
  - unlimited Range (you may want to reduce the range if multiple towers are present due to efficiency degradation)
  - attack, heal, repair 

# Automatic Structure Management
- Modules
  - BuildMachine
  
- Street Building
  - build all n ticks m new streets (n=1000,m=3)
  - depending on which fields are frequently used 

- Intentional Street Degradation (SOON)
  - don't repair seldomly used roads
  

# Your Tasks
- tweak parameters (TODO: which)
- build all structure except for roads 
- main: define max number of creeps to spawn
- main: define relative quantity of tasks per type (SOON: removed)

