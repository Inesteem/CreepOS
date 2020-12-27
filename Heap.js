/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('Heap');
 * mod.thing == 'a thing'; // true
 */

function Heap(compare) {
    this.array = [];
    this.compare = compare;
}

Heap.prototype.pop() {
    
}

Heap.prototype.peek() {
    
}

Heap.prototype.insert(elem) {
    
}

Heap.prototype.heapify(i) {
    if (i < 0 || i > array.length) return;
    let next_i = i;
    
    if (this.left(i) < array.length && this.compare(array[left(i)], array[i]) > 0)
        next_i = this.left(i);
        
    if (this.right(i) < array.length && this.compare(array[right(i)], array[i]) > 0)
        next_i = this.right(i);
    
    
}       

Heap.prototype.left(i) {
    return i * 2;
}

Heap.prototype.right(i) {
    return i * 2 + 1;
}

module.exports = {

};