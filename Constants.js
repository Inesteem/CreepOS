const MAX_WORKER_NUM = 3;
const MAX_MINER_NUM = 4;


//ticks after which a specific path is recalculated
const PATH_REUSE_TICKS = 20;

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

module.exports = {
    MAX_WORKER_NUM : MAX_WORKER_NUM,
    MAX_MINER_NUM : MAX_MINER_NUM,
    PARALLEL_CONSTRUCTION_SITE_BUILD_NUM : PARALLEL_CONSTRUCTION_SITE_BUILD_NUM,
    PARALLEL_ROAD_BUILD_NUM : PARALLEL_ROAD_BUILD_NUM,
    PARALLEL_EXTENSION_BUILD_NUM : PARALLEL_EXTENSION_BUILD_NUM,
    PARALLEL_CONTAINER_BUILD_NUM : PARALLEL_CONTAINER_BUILD_NUM,
    AUTOMATIC_ROAD_BUILD_NUM : AUTOMATIC_ROAD_BUILD_NUM,
    AUTOMATIC_ROAD_BUILD_TICKS : AUTOMATIC_ROAD_BUILD_TICKS,
    PATH_REUSE_TICKS : PATH_REUSE_TICKS,
    Role : Role, 
};