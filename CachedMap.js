import { error } from "./Logging";

export class CachedMap {
    /**
     * Runtime: O(<number entries>)
     * @param {string} name 
     */
    constructor(name) {
        this.map = new Map(/** @type {Array<Array<?>>} */(JSON.parse(this.memory)));
        this.name = name;
    }

    get memory() {
        Memory["CachedMap"] =  Memory["CachedMap"] || {};
        return Memory["CachedMap"][this.name] || "[]";
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
    /**
     * Runtime O(<number entries>)
     */
    save() {
        let entries = JSON.stringify(Array.from(this.map.entries));
        error("save entries: ", entries);
        this.memory = entries;
    }
}

