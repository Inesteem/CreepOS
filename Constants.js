export const MAX_WORKER_NUM = 5;
export const MAX_MINER_NUM = 4;
export const MAX_SCOUT_NUM = 1;


//ticks after which a specific path is recalculated
export const PATH_REUSE_TICKS = 2;

//TODO:give up time

//------------------
//defines the number of build tasks concerning different
//structure types that can be scheduled at the same time

//overall construction sites that can be scheduled at the
//same time 
export const PARALLEL_CONSTRUCTION_SITE_BUILD_NUM = 1;
export const PARALLEL_ROAD_BUILD_NUM = 1;
export const PARALLEL_EXTENSION_BUILD_NUM = 1;
export const PARALLEL_CONTAINER_BUILD_NUM = 1;

//------------------
//constants for automatic road build manager

//number of ticks required to determine the next road 
//construction sites
export const AUTOMATIC_ROAD_BUILD_TICKS = 1000;
//number of road construction sites that are defined
//at the same time
export const AUTOMATIC_ROAD_BUILD_NUM = 1;

export const Role = {
  MINER: 1,
  WORKER: 2,
  ARCHER: 4,
  SCOUT: 5,
  SLAYER: 6,
};

// There are four equideistant priority levels:
// 0: We don't care
// 1: Should be done at some point
// 2: Do now.
// 3: Emergency
// The distance is level*PRIORITY_LEVEL
export const PRIORITY_LEVEL_STEP = 2000;

export const BUILD_ROAD_PRIORITY = 1 * PRIORITY_LEVEL_STEP;
export const BUILD_TOWER_PRIORITY = 1.5 * PRIORITY_LEVEL_STEP;
export const BUILD_EXTENSION_PRIORITY = 1.5 * PRIORITY_LEVEL_STEP;
export const BUILD_SPAWN_PRIORITY = 1 * PRIORITY_LEVEL_STEP;
export const BUILD_DEFAULT_PRIORITY = 1 * PRIORITY_LEVEL_STEP;


export const FILL_SPAWN_PRIORITY = 2.5 * PRIORITY_LEVEL_STEP;
export const FILL_TOWER_PRIORITY = 2 * PRIORITY_LEVEL_STEP;
export const FILL_EXTENSION_PRIORITY = 2.5 * PRIORITY_LEVEL_STEP;
export const FILL_DEFAULT_PRIORITY = 1 * PRIORITY_LEVEL_STEP;

export const FILL_STORE_DEFAULT_PRIORITY = 2.5 * PRIORITY_LEVEL_STEP;

export const REPAIR_DEFAULT_PRIORITY =   0 * PRIORITY_LEVEL_STEP;
export const REPAIR_PRIORITY = {
  STRUCTURE_ROAD : 0 * PRIORITY_LEVEL_STEP,
  STRUCTURE_CONTAINER : 2 * PRIORITY_LEVEL_STEP,
  STRUCTURE_STORAGE :   2 * PRIORITY_LEVEL_STEP,
  STRUCTURE_WALL :      0 * PRIORITY_LEVEL_STEP,
  STRUCTURE_RAMPART :   1 * PRIORITY_LEVEL_STEP,
}



export const REDISTRIBUTE_DEFAULT_PRIORITY = 1 * PRIORITY_LEVEL_STEP;

export const UPGRADE_HIGH_PRIORITY = 2 * PRIORITY_LEVEL_STEP;
export const UPGRADE_LOW_PRIORITY = 1 * PRIORITY_LEVEL_STEP;

export const ERR_NO_SPAWN = -200;

export const TERRAIN_SWAMP = "swamp";
export const TERRAIN_PLAIN = "plain";
export const TERRAIN_WALL = "wall";

export const INFINITY = 0xffffffff;

export const MEELE_NAMES = ["Aragorn", "Gimli", "Ulf", "Beowulf", "Siegfried", "Sigurd", "Kara"];
export const HEALER_NAMES = ["Gandalf", "Katara", "Zed", "Lisa"];
export const RANGED_NAMES = ["Legolas"];

export const GENERIC_NAMES = ["Kevin", "Chantale", "Michelle", "Antoinette", "Mandy", "Maurice", "Justin", "Vanessa"];

export const MINER_NAMES = ["Lukas", "Simon"];

export const REPAIRER_NAMES = ["Luigi", "Mario"];