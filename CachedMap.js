
export class CachedMap {
    /**
     * Runtime: O(<number entries>)
     * @param {string} name 
     */
    constructor(name) {
        Memory["CachedMap"] =  Memory["CachedMap"] || {};
        Memory["CachedMap"][name] = Memory["CachedMap"][name] || "[]";

        this.map = new Map(/** @type {Array<Array<?>>} */(JSON.parse(Memory["CachedMap"][this.name])));
        this.name = name;
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
        Memory["CachedMap"][this.name] = entries;
    }
}

