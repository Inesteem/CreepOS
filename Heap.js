function getMinHeap(){
	return  new Heap((a,b) => {
		if ((a-b) < 0) return -1;
		else if ((a-b) === 0) return 0;
		else return 1;
	});
}

function swapElements(array, i1, i2) {
	[ array[i1], array[i2] ] = [ array[i2], array[i1] ];
}
function leftHasHigherPriority(a,b,compare) {
	let p = compare(a,b);
	return p === -1;
}

function isHeap(heap, idx) {
	if (!heap.isValidIdx(idx)) return true;

	let left_idx = heap.leftChildIdx(idx);
	let right_idx = heap.rightChildIdx(idx);

//	console.log(heap.elemAt(idx) + " " + heap.elemAt(left_idx) + " " + heap.elemAt(right_idx));
	if (heap.isValidIdx(left_idx)) {
		if (leftHasHigherPriority(heap.elemAt(left_idx), heap.elemAt(idx), heap.compare))
			return false;
		if (!isHeap(heap,left_idx)) return false;
	}

	if (heap.isValidIdx(right_idx)) {
		if (leftHasHigherPriority(heap.elemAt(right_idx), heap.elemAt(idx), heap.compare))
			return false;
		return isHeap(heap,right_idx);
	}

	return true;
}

function Heap(compare) {
    this.array = [];
    this.compare = compare;
    
}

Heap.prototype.elemAt = function(idx) {
	return this.array[idx];
}

Heap.prototype.leftChildIdx = function(n_idx) {
    if (n_idx < 0) return -1;
    return n_idx * 2 + 1;
}

Heap.prototype.rightChildIdx = function(n_idx) {
    if (n_idx < 0) return -1;
    return n_idx * 2 + 2;
}


Heap.prototype.parentIdx = function(n_idx) {
    if (n_idx <= 0) return -1;
    return parseInt((n_idx-1)/2);
}

Heap.prototype.insert = function(elem) {
    this.array.push(elem);
    
    let n_idx = this.array.length-1;
    while (n_idx > 0) {
        let p_idx = this.parentIdx(n_idx);
        if(leftHasHigherPriority(this.array[p_idx], this.array[n_idx], this.compare)){
            break;
        }
        swapElements(this.array, n_idx, p_idx);
        n_idx = p_idx;  
    }
    
}

Heap.prototype.isValidIdx = function(idx) {
	return idx >= 0 && idx < this.array.length;
}


Heap.prototype.isEmpty = function() {
	return this.array.length === 0;
}
	
Heap.prototype.pop = function() {
    if (this.isEmpty()) return -1;//TODO
    
    let ret = this.array[0];
    let new_top = this.array.pop();
    if(this.isEmpty()) return ret;
	this.array[0] = new_top;
	let n_idx = 0;
    
    while (this.isValidIdx(n_idx)) {
        let left_idx = this.leftChildIdx(n_idx);
        let right_idx = this.rightChildIdx(n_idx);
        let left_higher_prioritised = false;
        let right_higher_prioritised = false;
        
        if (this.isValidIdx(left_idx)) {
			//check if child has highter priority
			left_higher_prioritised = 
					leftHasHigherPriority(this.array[left_idx],
							this.array[n_idx],
							this.compare);
        } else {//no left child means there is no right child either
			break; 
        }
        
        if (this.isValidIdx(right_idx)) {
			//check if child has highter priority
			right_higher_prioritised = 
					leftHasHigherPriority(this.array[right_idx],
							this.array[n_idx],
							this.compare); 
        } 
        
        let choose_idx = left_idx;
        if (!left_higher_prioritised){
			//node has higher priority than both childs
			if(!right_higher_prioritised) {
				break;
			}
			
			choose_idx = right_idx;
		} else if (right_higher_prioritised) { //both childs higher prioritized
			if (leftHasHigherPriority(this.array[right_idx], 
					this.array[left_idx],
					this.compare)) {
				choose_idx = right_idx;
			}
		}       
		swapElements(this.array, n_idx, choose_idx);
        n_idx = choose_idx; 
    }
    return ret;
}

Heap.prototype.peek = function() {
	if (this.isEmpty()) return -1;
    return this.array[0];
}

module.exports = {
	Heap : Heap,
	isHeap : isHeap,
	getMinHeap : getMinHeap,
};
