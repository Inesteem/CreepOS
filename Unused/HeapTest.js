var memory = require("./Heap");

//assumes that both arrays have the elements ordered the same way
function arraysEqual(_arr1, _arr2) {
    if (
        !Array.isArray(_arr1)
        || !Array.isArray(_arr2)
        || _arr1.length !== _arr2.length
    ) {
        return false;
    }

    // .concat() is used so the original arrays are unaffected
    const arr1 = _arr1.concat().sort();
    const arr2 = _arr2.concat().sort();

    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }

    return true;
}



function test_is_heap(){
    let heap = memory.getMinHeap();

    heap.array = [1];
    console.assert(memory.isHeap(heap,0), "valid heap specified as invalid");

    heap.array = [1,1,1,1,1,1,1,10];
    console.assert(memory.isHeap(heap,0), "valid heap specified as invalid");

    heap.array = [1,2,3,4,5,6,7,8,9,10];
    console.assert(memory.isHeap(heap,0), "valid heap specified as invalid");

    heap.array = [1,200,3,4,5,6,7,8,9,10];
    console.assert(!memory.isHeap(heap,0), "invalid heap specified as valid");

    heap.array = [1,2,3,4,5,6,7,8,9,2];
    console.assert(!memory.isHeap(heap,0), "invalid heap specified as valid");

    heap.array = [1,2,3,4,1,6,7,8,9];
    console.assert(!memory.isHeap(heap,0), "invalid heap specified as valid");
}

function test_heap_insert(){
    let heap = memory.getMinHeap();

    let elements = [1,78,4,2,6,9,734,32,6,13,3,7,86,334,2,1,798,-1,30,42,72,-100];

    for (e of elements) {
        heap.insert(e);
        console.assert(!heap.isEmpty(), "heap empty after insert");
        console.assert(memory.isHeap(heap,0), "insert failed");
    }
//    console.log(JSON.stringify(heap.array));
    console.assert(heap.array[0] === -100, "wrong min element after inserting");
}

function test_heap_pop(){
    let heap = memory.getMinHeap();
    let elements = [1,78,4,2,6,9,734,32,6,13,3,7,86,334,2,1,798,-1,30,42,72,-100];
    for (e of elements) {
        heap.insert(e);
    }
    heap.insert(-200);
    console.assert(heap.pop() === -200, "pop did not return the element with the highest priority");

    for (e in elements){
        heap.pop();
        //console.log(JSON.stringify(heap.array));
        console.assert(memory.isHeap(heap,0), "pop failed");
    }
    console.assert(heap.isEmpty(),"heap not empty after elements are removed");
    console.assert(heap.pop() === -1,"pop returns element even if empty");
}

function test_heap_peek(){
    let heap = memory.getMinHeap();

    console.assert(heap.peek() === -1,"peek returns element even if empty");
    let elements = [1,78,4,2,6,9,734,32,6,13,3,7,86,334,2,1,798,-1,30,42,72,-100];
    for (e of elements) {
        heap.insert(e);
    }
    //copy heap
    const heap_elems  = [...heap.array];
    console.assert(heap.peek() === -100, "peek returns wrong element")
    console.assert(arraysEqual(heap_elems, heap.array), "heap elements changed after peek");

}

test_is_heap();
test_heap_insert();
test_heap_pop();
test_heap_peek();