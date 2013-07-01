module.exports = ShiftRegister;

// # ShiftRegister Constructor
//    * size: the size of the register (size of the array).
function ShiftRegister(size) {
    var self = this;
    if(!(self instanceof ShiftRegister)){ return new ShiftRegister(size); }
    self.register = [];
    for(var i=0; i<size; i++){
        self.register.push("*");
    }
}

// ## ShiftRegister.concatenate
//    * reg: the ShiftRegister that should be concatenated with this ShiftRegister
ShiftRegister.prototype.concatenate = function(reg){
    var self = this;
    var temp = self.register.slice(0);//self.list(self.register);
    var arr = temp.concat(reg.register);
    return arr;
};

// ## ShiftRegister.shift
// shift removes an element from the front of the list and pushes the provided element to the back of the list.  So in essence, it does a shift() then a push() on the internal array that this ShiftRegister wraps.
//    * el: the element to push.
ShiftRegister.prototype.shift = function(el){
    var self = this;
    self.register.shift();
    self.register.push(el);
};

// ## ShiftRegister.len
// len provides the length of this ShiftRegister (the internal array that this ShiftRegister represents), or the ShiftRegister itself.
//    * reg: a ShiftRegister that if provided the length is desired, otherwise if not provided, the length of this ShiftRegister is returned. 
ShiftRegister.prototype.len = function(reg) {
    var self = this;
    if(typeof reg === 'undefined'){
        return self.register.length;
    }else{
        return reg.register.length;
    }
};

