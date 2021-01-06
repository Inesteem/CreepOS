// Node.js Hot-fixes
// From https://github.com/screepers/screeps-closure-compiler-externs
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
    creeps: {},
    spawns: {}
};

/**
 * @const
 */
var Room;



/**
 * @const
 */
var PathFinder = {
    
    /**
     * @param {RoomPosition} _origin
     * @param {Object} _goal
     * @param {Array<Object>} _opts
     */
    search : function(_origin, _goal, _ops) {}    

};

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
    this.pos = {};
};
Creep.prototype.attack = function(target) {};
Creep.prototype.attackController = function(target) {};
Creep.prototype.build = function(target) {};
Creep.prototype.cancelOrder = function(methodName) {};
Creep.prototype.claimController = function(target) {};
Creep.prototype.dismantle = function(target) {};
Creep.prototype.drop = function(resourceType, amount) {};
Creep.prototype.generateSafeMode = function(controller) {};
Creep.prototype.getActiveBodyparts = function(type) {};
Creep.prototype.harvest = function(target) {};
Creep.prototype.heal = function(target) {};
Creep.prototype.move = function(direction) {};
Creep.prototype.moveByPath = function(path) {};
Creep.prototype.moveTo = function(target) {};
Creep.prototype.notifyWhenAttacked = function(enabled) {};
Creep.prototype.pickup = function(target) {};
Creep.prototype.rangedAttack = function(target) {};
Creep.prototype.rangedHeal = function(target) {};
Creep.prototype.rangedMassAttack = function() {};
Creep.prototype.repair = function(target) {};
Creep.prototype.reserveController = function(target) {};
Creep.prototype.say = function(message, isPublic) {};
Creep.prototype.signController = function(target, text) {};
Creep.prototype.suicide = function() {};
Creep.prototype.transfer = function(target, resourceType, amount) {};
Creep.prototype.upgradeController = function(target) {};
Creep.prototype.withdraw = function(target, resourceType, amount) {};

var RoomPosition = function() {};
RoomPosition.prototype.findClosestByRange = function(type, opts) {};

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


/** @const {number} */
var RESOURCE_ENERGY;