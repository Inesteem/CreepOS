import { error } from "./Logging";

export class CachedMap {
    /**
     * Runtime: O(<number entries>)
     * @param {string} name 
     */
    constructor(name) {
        this.map = new Map(/** @type {Array<Array<?>>} */(this.memory));
        this.name = name;
    }

    get memory() {
        Memory["CachedMap"] =  Memory["CachedMap"] || {};
        return Memory["CachedMap"][this.name] || [];
    }
    set memory(memory_value) {
        Memory["CachedMap"] =  Memory["CachedMap"] || {};
        Memory["CachedMap"][this.name] = memory_value;
    }

    set(key, value) {
        this.map.set(key, value);
    }
    get(key) {
        return this.map.get(key);
    }
    delete(key) {
        return this.map.delete(key);
    }
    has(key) {
        return this.map.has(key);
    }
    /**
     * Runtime O(<number entries>)
     */
    save() {
        const entries = Array.from(this.map.entries());
        this.memory = entries;
    }
}

