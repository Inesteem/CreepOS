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
    /** @type {Object} */
    creeps: {},
    /** @type {Object} */
    spawns: {},
    /** @type {Object} */
    flags: {},
    /** @type {number} */
    time: 0,
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
/** @type {controller} */
Room.prototype.controller;
/**
 * Find all objects of the specified type in the room. Results are cached automatically for the specified room and type before applying any custom filters. This automatic cache lasts until the end of the tick.
 * @param {number} type One of the FIND_* constants.
 * @param {opts=} opts An object with additional options.
 * @return {Array<Object>} An array with the objects found.
 */
Room.prototype.find = function(type, opts) {};

var PathFinder = {
    
    /**
     * @param {RoomPosition} _origin
     * @param {Object} _goal
     * @param {Object=} _opts
     * @return {path: Array<RoomPosition>, ops: number, cost: number, incomplete: boolean}
     */
    search : function(_origin, _goal, _opts) {}    

};

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
 * @param {string} type 
 * @return {number} 
 */
Creep.prototype.getActiveBodyparts = function(type) {};
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
 * @param {Structure | Creep | Controller} target 
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
/** @type Room */
Creep.prototype.room;
/** @type number */
Creep.prototype.hitsMax;
/** @type number */
Creep.prototype.hits;

var Tombstore = function () {};
var Ruin = function () {};

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
 * @return {(Structure | Creep)}
 */
RoomPosition.prototype.findClosestByPath = function(type, opts) {};
/**
 * @param {number} dir 
 * @return {number}
 */
RoomPosition.prototype.getDirectionTo = function(dir) {};
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
 * @param {...Object} var_args (x, y, range) or (target, range)
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

/**
 * @constructor
 */
var Store = function() {};
/** @type {function(!number): number} */
Store.prototype.getFreeCapacity = (resourceType) => {};

/**
 * @constructor
 */
var Structure = function() {};
/** @type {string} */
Structure.prototype.structureType;
/** @type {Store} */
Structure.prototype.store;
/** @type {number} */
Structure.hits;
/** @type {number} */
Structure.hitsMax;

var StructureTower; 

/** @const {number} */
var ERR_NOT_IN_RANGE;
/** @const {number} */
var ERR_NOT_ENOUGH_ENERGY;

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

/** @const {number} */
var FIND_MY_CREEPS;
/** @const {number} */
var FIND_MY_STRUCTURES;
/** @const {number} */
var FIND_HOSTILE_CREEPS;
/** @const {number} */
var FIND_STRUCTURES;
/** @const {number} */
var FIND_SOURCES_ACTIVE;
/** @const {number} */
var FIND_SOURCES;
/** @const {number} */
var FIND_DROPPED_RESOURCES;


/** @const {number} */
var LOOK_CONSTRUCTION_SITES;
/** @const {number} */
var FIND_MY_CONSTRUCTION_SITES;
/** @const {number} */
var LOOK_SOURCES;
/** @const {number} */
var LOOK_STRUCTURES;


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