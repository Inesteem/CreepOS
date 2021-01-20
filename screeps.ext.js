// Node.js Hot-fixes
// Partially from https://github.com/screepers/screeps-closure-compiler-externs
// MIT License

// Copyright (c) 2017 

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * @const
 */
var process = {
    argv: {},
    argc: {}
};

/**
 * @type {Object}
 */
var module = {
    exports: {}
};


// Actual Screeps API

/**
 * @type {Object}
 */
var Memory = {};

/**
 * @const
 */
var Game = {
    /** @type {!Object} */
    creeps: {},
    /** @type {!Object} */
    spawns: {},
    /** @type {!Object} */
    flags: {},
    /** @type {number} */
    time: 0,
    /** @type {!Object} */
    rooms: {},
    /** @type {{limit: number, getUsed: function():number}} */
    cpu: {},
    /**
     * @param {string} id
     * @return {Object}
     */
    getObjectById: function (id) {},
};

/**
 * @constructor
 */
var Room = function () {};
/** @type {number} */
Room.prototype.energyAvailable;
/** @type {number} */
Room.prototype.energyCapacityAvailable;
/** @type {?StructureController} */
Room.prototype.controller;
/** @type {!string} */
Room.prototype.name;
/** @type {?StructureStorage} */
Room.prototype.storage;
/**
 * Find all objects of the specified type in the room. Results are cached automatically for the specified room and type before applying any custom filters. This automatic cache lasts until the end of the tick.
 * @param {number} type One of the FIND_* constants.
 * @param {Object=} opts An object with additional options.
 * @return {Array<Object>} An array with the objects found.
 */
Room.prototype.find = function(type, opts) {};
/**
 * @param {string} type
 * @param {number} top    Y
 * @param {number} left   X
 * @param {number} right  Y
 * @param {number} bottom X
 * @param {boolean=} asArray 
 * @return {Object|Array<{x : number, y : number, structure: Structure}>} 
 *  */
Room.prototype.lookForAtArea = function(type, top, left, bottom, right, asArray) {};
/**
 * Create new ConstructionSite at the specified location.
 * @param {...(Object | number | string)} var_args (x, y, StructureType, [name]) or (pos, structureType, name)
 * @return {number} OK or error code.
 */
Room.prototype.createConstructionSite = function(var_args) {};
/**
 * 
 * @param {...(Object | number | string)} var_args 
 */
Room.prototype.lookForAt = function(var_args) {};

/**
 * Any object with a position in a room. Almost all game objects prototypes are derived from RoomObject.
 * @constructor
 */
var RoomObject = function() {};
/** @type {RoomPosition} */
RoomObject.prototype.pos;
/** @type {Room} */
RoomObject.prototype.room;

var PathFinder = {
    
    /**
     * @param {RoomPosition} _origin
     * @param {Object} _goal
     * @param {Object=} _opts
     * @return {{path: Array<RoomPosition>, ops: number, cost: number, incomplete: boolean}}
     */
    search : function(_origin, _goal, _opts) {},

    /**
     * @constructor
     */
    CostMatrix: function() {
        this.set = function(x, y, cost) {};
    }
};

/**
 * @constructor
 * @extends {Structure}
 */
var OwnedStructure = function() {};
/** @type {boolean} */
OwnedStructure.prototype.my;

/**
 * @constructor
 * @extends {Structure}
 */
var StructureKeeperLair = function() {};

/**
 * @constructor
 * @extends {OwnedStructure}
 */
var StructureController = function() {};
/** 
 * How many ticks of safe mode remaining, or undefined.
 * @type {number} */
StructureController.prototype.safeMode;
/** 
 * During this period in ticks new safe mode activations will be blocked, undefined if cooldown is inactive. 
 * @type {number} */
StructureController.prototype.safeModeCooldown;
/** 
 * Safe mode activations available to use.
 * @type {number} */
StructureController.prototype.safeModeAvailable;
/** 
 * Activate safe mode if available.
 * @return {number} */
StructureController.prototype.activateSafeMode = function() {};

/**
 * @extends RoomObject
 * @constructor
 */
var StructureStorage = function () {};
/**
 * @type {Store}
 */
StructureStorage.prototype.store;

/**
 * @constructor
 * @extends {Structure}
 */
var StructureSpawn = function () {};
/**
 * 
 * @param {Array<string>} body 
 * @param {string} name 
 * @param {Object=} opts
 * @return {number} 
 */
StructureSpawn.prototype.spawnCreep = function(body, name, opts) {}
/**
 * @type {Object}
 */
StructureSpawn.prototype.spawning;

/**
 * @constructor
 */
var Mineral = function() {};

/**
 * @constructor
 */
var PowerCreep = function() {};

/**
 * @constructor
 */
var Creep = function() {
    /**
     * @type {Array<Object>}
     */
    this.body = [{
        boost: {},
        type: {},
        hits: {}
    }];

    this.carry = {
        energy: {}
    };

    this.carryCapacity = {};

    /**
     * @type {RoomPosition}
     */
    this.pos;
};
/** @type {{username : String}} */
Creep.prototype.owner;
/** @type {string} */
Creep.prototype.name;
/**
 * @param {Creep|PowerCreep|Structure} target
 * @return {number} 
 */
Creep.prototype.attack = function(target) {};
/**
 * @param {StructureController} target
 * @return {number} 
 */
Creep.prototype.attackController = function(target) {};
/**
 * @param {ConstructionSite} target
 * @return {number} 
 */
Creep.prototype.build = function(target) {};
/**
 * @param {string} methodName 
 * @return {number} 
 */
Creep.prototype.cancelOrder = function(methodName) {};
/**
 * @param {StructureController} target 
 * @return {number} 
 */
Creep.prototype.claimController = function(target) {};
/**
 * @param {Structure} target 
 * @return {number} 
 */
Creep.prototype.dismantle = function(target) {};
/**
 * @param {string} resourceType
 * @param {number=} amount 
 * @return {number} 
 */
Creep.prototype.drop = function(resourceType, amount) {};
/**
 * @param {StructureController} controller 
 * @return {number} 
 */
Creep.prototype.generateSafeMode = function(controller) {};
/**
 * @param {Source|Mineral|Deposit} target 
 * @return {number} 
 */
Creep.prototype.harvest = function(target) {};
/**
 * @param {Creep | PowerCreep} target 
 * @return {number} 
 */
Creep.prototype.heal = function(target) {};
/**
 * @param {Creep|number} direction 
 * @return {number} 
 */
Creep.prototype.move = function(direction) {};
Creep.prototype.moveByPath = function(path) {};
/**
 * @param {Structure | Creep | Controller | Source | RoomPosition} target 
 * @param {Object=} opts 
 */
Creep.prototype.moveTo = function(target, opts) {};
Creep.prototype.notifyWhenAttacked = function(enabled) {};
/**
 * @param {Resource} target
 * @return {number} 
 */
Creep.prototype.pickup = function(target) {};
/**
 * @param {Creep} target
 * @return {number} 
 */
Creep.prototype.pull = function(target) {};
/**
 * @param {Creep|Structure|PowerCreep} target
 * @return {number} 
 */
Creep.prototype.rangedAttack = function(target) {};
/**
 * @param {Creep|PowerCreep} target
 * @return {number} 
 */
Creep.prototype.rangedHeal = function(target) {};
/**
 * @return {number} 
 */
Creep.prototype.rangedMassAttack = function() {};
/**
 * @param {Structure} target
 * @return {number} 
 */
Creep.prototype.repair = function(target) {};
/**
 * @param {StructureController} target
 * @return {number} 
 */
Creep.prototype.reserveController = function(target) {};
/**
 * @param {string} message 
 * @param {boolean=} isPublic 
 * @return {number} 
 */
Creep.prototype.say = function(message, isPublic) {};
/**
 * @param {StructureController} target
 * @param {string} text
 * @return {number} 
 */
Creep.prototype.signController = function(target, text) {};
/**
 * @return {number} 
 */
Creep.prototype.suicide = function() {};
/**
 * @param {Structure|Tombstone|Ruin} target 
 * @param {string} resourceType 
 * @param {number=} amount 
 * @return {number} 
 */
Creep.prototype.transfer = function(target, resourceType, amount) {};
/**
 * @param {StructureController} target 
 * @return {number} 
 */
Creep.prototype.upgradeController = function(target) {};
/**
 * @param {Structure|Tombstone|Ruin} target 
 * @param {string} resourceType
 * @param {number=} amount 
 * @return {number} 
 */
Creep.prototype.withdraw = function(target, resourceType, amount) {};
/**
 * Get the quantity of live body parts of the given type. Fully damaged parts do not count.
 * @param {number} type 
 * @return {number} A number representing the quantity of body parts.
 */
Creep.prototype.getActiveBodyparts = function(type) {};
/** @type {Room} */
Creep.prototype.room;
/** @type {number} */
Creep.prototype.hitsMax;
/** @type {number} */
Creep.prototype.hits;
/** @type {Store} */
Creep.prototype.store;
/** @type {string} */
Creep.prototype.id;
Creep.prototype.memory;

/**
 * @constructor
 */
var ConstructionSite = function () {};
/** @type {number} */
ConstructionSite.prototype.progressTotal;
/** @type {number} */
ConstructionSite.prototype.progress;
/** @type {string} */
ConstructionSite.prototype.id;

/**
 * @constructor
 */
var Tombstone = function () {};

/**
 * @constructor
 */
var Deposit = function () {};

/**
 * @constructor
 */
var Ruin = function () {};

/**
 * A dropped piece of resource. It will decay after a while if not picked up. Dropped resource pile decays for ceil(amount/1000) units per tick.
 * @constructor
 */
var Resource = function () {};
/** @type {number} */
Resource.prototype.amount;
/** @type {string} */
Resource.prototype.resourceType;

/**
 * @constructor
 * @extends {RoomObject}
 */
var Source = function () {};
/** @type {string} */
Source.prototype.id;

/**
 * @constructor
 */
var Controller = function() {};
/**
 * @type {boolean}
 */
Controller.prototype.safeMode;
Controller.prototype.safeModeCooldown;

/**
 * @constructor
 * @param {!number} pos_x 
 * @param {!number} pos_y 
 * @param {!string} room_name 
 */
var RoomPosition = function(pos_x, pos_y, room_name) {};
/** @type {number} */
RoomPosition.prototype.x;
/** @type {number} */
RoomPosition.prototype.y;
/**
 * @param {number|Array<RoomPosition>|Array<Room>} type
 * @param {number} range
 * @param {Object=} opts  
 */
RoomPosition.prototype.findInRange = function(type, range, opts){};
/**
 * @param {!(number|Array<Room>|Array<RoomPosition>)} type 
 * @param {Object=} opts
 * @return {(Structure | Creep)}
 */
RoomPosition.prototype.findClosestByRange = function(type, opts) {};
/**
 * @param {!(number|Array<Room>|Array<RoomPosition>)} type 
 * @param {Object=} opts
 * @return {(Source | Structure)}
 */
RoomPosition.prototype.findClosestByPath = function(type, opts) {};
/**
 * Get linear direction to the specified position.
 * @param {...Object} var_args
 * @return {number} A number representing one of the direction constants.
 */
RoomPosition.prototype.getDirectionTo = function(var_args) {};
/**
 * @param {...Object} var_args
 * @return {Array<Object>} 
 *  */
RoomPosition.prototype.lookForAt = function(var_args) {};
/**
 * @param {!string} structreType
 * @return {number}
 */
RoomPosition.prototype.createConstructionSite = function(structreType) {};
/**
 * Check whether this position is in the given range of another position.
 * @param {...(Object | number)} var_args (x, y, range) or (target, range)
 * @return {boolean} A boolean value. 
 */
RoomPosition.prototype.inRangeTo = function(var_args) {};
/**
 * Find all objects of the specified type in the room. Results are cached automatically for the specified room and type before applying any custom filters. This automatic cache lasts until the end of the tick.
 * @param {number} type One of the FIND_* constants.
 * @param {Object=} opts An object with additional options.
 * @return {Array<Object>} An array with the objects found.
 */
RoomPosition.prototype.find = function(type, opts) {};
/**
 * Find an optimal path to the specified position using Jump Point Search algorithm. This method is a shorthand for Room.findPath. If the target is in another room, then the corresponding exit will be used as a target.
 * @param {...Object} var_args 
 * @return {Array<{x: number, y: number, dx: number, dy: number, direction: number}>} An array with path steps in the following format.
 */
RoomPosition.prototype.findPathTo = function(var_args) {};
/** @type {string} */
RoomPosition.prototype.roomName;
/**
 * Get linear range to the specified position. 
 * @param {...(Object | number)} var_args Can be (target) or (x, y) 
 * @return {number}
 */
RoomPosition.prototype.getRangeTo = function(var_args) {};
/**
 * 
 * @param {string} type 
 */
RoomPosition.prototype.lookFor = function(type) {};

/**
 * @constructor
 */
var Store = function() {};
/** 
 *  @param {string} resourceType 
 *  @return {number|null}
*/
Store.prototype.getFreeCapacity = function (resourceType) {};
/** 
 *  @param {string} resourceType 
 *  @return {number|null}
*/
Store.prototype.getCapacity = function (resourceType) {};

/**
 * @constructor
 * @extends {RoomObject}
 */
var Structure = function() {};
/** @type {string} */
Structure.prototype.structureType;
/** @type {Store} */
Structure.prototype.store;
/** @type {number} */
Structure.prototype.hits;
/** @type {number} */
Structure.prototype.hitsMax;
/** @type {string} */
Structure.prototype.id;

var StructureTower; 

/**
 * @constructor
 * @extends {RoomObject}
 */
var Flag = function() {};

/** @const {number} */
var ERR_NOT_IN_RANGE;
/** @const {number} */
var ERR_NOT_ENOUGH_ENERGY;
/** @const {number} */
var ERR_INVALID_TARGET;
/** @const {number} */
var ERR_FULL;
/** @const {number} */
var ERR_RCL_NOT_ENOUGH;
/** @const {number} */
var OK;

/** @const {string} */
var STRUCTURE_STORAGE;
/** @const {string} */
var STRUCTURE_TOWER;
/** @const {string} */
var STRUCTURE_CONTAINER;
/** @const {string} */
var STRUCTURE_ROAD;
/** @const {string} */
var STRUCTURE_EXTENSION;
/** @const {string} */
var STRUCTURE_SPAWN;
/** @const {string} */
var STRUCTURE_WALL;
/** @const {string} */
var STRUCTURE_KEEPER_LAIR;
/** @const {string} */
var STRUCTURE_RAMPART;

/** @const {number} */
var FIND_MY_CREEPS;
/** @const {number} */
var FIND_MY_STRUCTURES;
/** @const {number} */
var FIND_HOSTILE_CREEPS;
/** @const {number} */
var FIND_HOSTILE_STRUCTURES;
/** @const {number} */
var FIND_STRUCTURES;
/** @const {number} */
var FIND_ENEMY_STRUCTURES;
/** @const {number} */
var FIND_SOURCES_ACTIVE;
/** @const {number} */
var FIND_SOURCES;
/** @const {number} */
var FIND_DROPPED_RESOURCES;
/** @const {number} */
var FIND_MY_CONSTRUCTION_SITES;
/** @const {number} */
var FIND_CONSTRUCTION_SITES;

/** @const {string} */
var LOOK_CONSTRUCTION_SITES;
/** @const {string} */
var LOOK_SOURCES;
/** @const {string} */
var LOOK_STRUCTURES;
/** @const {string} */
var LOOK_TERRAIN;
/** @const {string} */
var LOOK_CREEPS;


/** @const {number} */
var ATTACK;
/** @const {number} */
var MOVE;
/** @const {number} */
var RANGED_ATTACK;
/** @const {number} */
var WORK;
/** @const {number} */
var HEAL;
/** @const {number} */
var TOUGH;
/** @const {number} */
var CLAIM;
/** @const {number} */
var CARRY;


/** @const {string} */
var RESOURCE_ENERGY;

/** @const {{extension: Array<number>}} */
var CONTROLLER_STRUCTURES;

/** @const Array<string> */
var OBSTACLE_OBJECT_TYPES;