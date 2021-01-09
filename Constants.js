const MAX_WORKER_NUM = 10;
const MAX_MINER_NUM = 5;


//ticks after which a specific path is recalculated
const PATH_REUSE_TICKS = 2;

//TODO:give up time

//------------------
//defines the number of build tasks concerning different
//structure types that can be scheduled at the same time

//overall construction sites that can be scheduled at the
//same time 
const PARALLEL_CONSTRUCTION_SITE_BUILD_NUM = 1;
const PARALLEL_ROAD_BUILD_NUM = 1;
const PARALLEL_EXTENSION_BUILD_NUM = 1;
const PARALLEL_CONTAINER_BUILD_NUM = 1;

//------------------
//constants for automatic road build manager

//number of ticks required to determine the next road 
//construction sites
const AUTOMATIC_ROAD_BUILD_TICKS = 1000;
//number of road construction sites that are defined
//at the same time
const AUTOMATIC_ROAD_BUILD_NUM = 1;

const Role = {
  MINER: 1,
  WORKER: 2,
  ARCHER: 4,
  SCOUT: 5,
};

// There are four equideistant priority levels:
// 0: We don't care
// 1: Should be done at some point
// 2: Do now.
// 3: Emergency
// The distance is level*PRIORITY_LEVEL
const PRIORITY_LEVEL_STEP = 1000;

const BUILD_ROAD_PRIORITY = 1 * PRIORITY_LEVEL_STEP;
const BUILD_TOWER_PRIORITY = 2 * PRIORITY_LEVEL_STEP;
const BUILD_EXTENSION_PRIORITY = 2 * PRIORITY_LEVEL_STEP;
const BUILD_DEFAULT_PRIORITY = 1 * PRIORITY_LEVEL_STEP;


const FILL_SPAWN_PRIORITY = 3 * PRIORITY_LEVEL_STEP;
const FILL_TOWER_PRIORITY = 2 * PRIORITY_LEVEL_STEP;
const FILL_EXTENSION_PRIORITY = 2.5 * PRIORITY_LEVEL_STEP;
const FILL_DEFAULT_PRIORITY = 1 * PRIORITY_LEVEL_STEP;

const REPAIR_ROAD_PRIORITY = 0 * PRIORITY_LEVEL_STEP;
const REPAIR_TOWER_PRIORITY = 1 * PRIORITY_LEVEL_STEP;
const REPAIR_EXTENSION_PRIORITY = 1 * PRIORITY_LEVEL_STEP;
const REPAIR_DEFAULT_PRIORITY = 0 * PRIORITY_LEVEL_STEP;

export {
  MAX_WORKER_NUM,
  MAX_MINER_NUM,
  PARALLEL_CONSTRUCTION_SITE_BUILD_NUM,
  PARALLEL_ROAD_BUILD_NUM,
  PARALLEL_EXTENSION_BUILD_NUM,
  PARALLEL_CONTAINER_BUILD_NUM,
  AUTOMATIC_ROAD_BUILD_NUM,
  AUTOMATIC_ROAD_BUILD_TICKS,
  PATH_REUSE_TICKS,
  BUILD_ROAD_PRIORITY,
  BUILD_TOWER_PRIORITY,
  BUILD_EXTENSION_PRIORITY,
  BUILD_DEFAULT_PRIORITY,
  PRIORITY_LEVEL_STEP,
  REPAIR_ROAD_PRIORITY,
  REPAIR_TOWER_PRIORITY,
  REPAIR_EXTENSION_PRIORITY,
  REPAIR_DEFAULT_PRIORITY,
  FILL_SPAWN_PRIORITY,
  FILL_TOWER_PRIORITY,
  FILL_EXTENSION_PRIORITY,
  FILL_DEFAULT_PRIORITY,
  Role,
}