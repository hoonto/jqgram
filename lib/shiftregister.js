module.exports = ShiftRegister;

function ShiftRegister(size) {
    var self = this;
    if(!(self instanceof ShiftRegister)){ return new ShiftRegister(size); }
    self.register = [];
    for(var i=0; i<size; i++){
        self.register.push("*");
    }
}

ShiftRegister.prototype.concatenate = function(reg){
    var self = this;
    var temp = self.register.slice(0);//self.list(self.register);
    var arr = temp.concat(reg.register);
    return arr;
};

ShiftRegister.prototype.shift = function(el){
    var self = this;
    self.register.shift();
    self.register.push(el);
};

ShiftRegister.prototype.len = function(reg) {
    var self = this;
    if(typeof reg === 'undefined'){
        return self.register.length;
    }else{
        return reg.register.length;
    }
};

