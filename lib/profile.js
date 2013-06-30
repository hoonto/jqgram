// # Profile
// Creates a PQ-Gram profile from a Node, using p and q values 
// Typicall this is not needed to be called in jqgram as it is done
// internally. 
//

var ShiftRegister = require("./shiftregister.js");

module.exports = Profile;

function Profile(root, p, q){
    var self = this;
    if(!(self instanceof Profile)){ return new Profile(root, p, q); }
    p = p || 2;
    q = q || 3;
    var ancestors = new ShiftRegister(p);
    self.list = [];
    self.profile(root, p, q, ancestors);
}

// Profile.profile method, utilizing root, p, q, and ancestors
Profile.prototype.profile = function(root, p, q, ancestors){
    var self = this;
    ancestors.shift(root.tedlabel);
    var siblings = new ShiftRegister(q);
    if(root.tedchildren.length === 0){
        self.append(ancestors.concatenate(siblings));
    }else{
        var childs = root.tedchildren;
        for(var i=0; i<childs.length; i++){
            var child = childs[i];
            if(!! child.tedlabel){
                siblings.shift(child.tedlabel);
                self.append(ancestors.concatenate(siblings));
                self.profile(child, p, q, clone(ancestors));
            }
        }
        for(var j=0; j<q-1; j++){
            siblings.shift("*");
            self.append(ancestors.concatenate(siblings));
        }
    }
};

// edit_distance
// determines the distance of this Profile to another
// Profile
// other: a Profile object representing the other profile
// against which to compare
Profile.prototype.edit_distance = function(other){
    var self = this;
    var union = self.list.length + other.list.length;
    return 1.0 - 2.0 * (self.intersection(other) / union);
};

// intersection
// determine the intersection of this Profile with another profile
// other: a Profile object representing the other profile against
// which to obtain the intersection
Profile.prototype.intersection = function(other){
    var self = this;
    var intersect = 0.0;
    var i = 0;
    var j = 0;
    while(i < self.list.length && j < other.list.length){
        intersect += self.gram_edit_distance(self.list[i], other.list[j]);
        var listi = self.list[i].join();
        var listj = self.list[j].join();
        if(listi === listj){
            i += 1;
            j += 1;
        }else if(listi < listj){
            i += 1;
        }else{
            j += 1;
        }
    }
    return intersect;
};

Profile.prototype.compare = function(a1,a2) {
    if (a1.length !== a2.length){ return false; }
    for (var i = 0; i < a2.length; i++) {
        //if (!self.compare(a1[i],a2[i])) return false;
        if (a1[i] !== a2[i]){ return false; }
    }
    return true;
};

Profile.prototype.gram_edit_distance = function(gram1, gram2){
    var self = this;
    var distance = 0.0;
    if(self.compare(gram1,gram2)){
        distance = 1.0;
    }
    return distance;
};

Profile.prototype.append = function(value){
    var self = this;
    self.list.push(value);
};

Profile.prototype.len = function(prof) {
    var self = this;
    if(typeof prof === 'undefined'){
        return self.list.length;
    }else{
        return prof.list.length;
    }
};

// # node-clone provided by Paul Vorbach
//
// Copyright © 2011-2013 Paul Vorbach
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

function clone(parent, circular) {
    if(typeof circular === 'undefined'){
        circular = false;
    }

    var useBuffer = (typeof Buffer !== 'undefined');

    var circularParent = {};
    var circularResolved = {};
    var circularReplace = [];

    function _clone(parent, context, child, cIndex) {
        var i; // Use local context within this function
        // Deep clone all properties of parent into child
        if (typeof parent === 'object') {
            if (parent === null){ return parent; }
            // Check for circular references
            for(i in circularParent){
                if (circularParent[i] === parent) {
                    // We found a circular reference
                    circularReplace.push({'resolveTo': i, 'child': child, 'i': cIndex});
                    return null; //Just return null for now...
                    // we will resolve circular references later
                }
            }

            // Add to list of all parent objects
            circularParent[context] = parent;
            // Now continue cloning...
            if (util.isArray(parent)) {
                child = [];
                for(i in parent){
                    child[i] = _clone(parent[i], context + '[' + i + ']', child, i);
                }
            }else if (util.isDate(parent)){
                child = new Date(parent.getTime());
            }else if (util.isRegExp(parent)){
                child = new RegExp(parent.source);
            }else if (useBuffer && Buffer.isBuffer(parent)) {
                child = new Buffer(parent.length);
                parent.copy(child);
            } else {
                child = {};
                // Also copy prototype over to new cloned object
                // MLM: Not needed. 
                //child.__proto__ = parent.__proto__;
                for(i in parent){
                    // MLM: don't clone on exception:
                    try{
                        child[i] = _clone(parent[i], context + '[' + i + ']', child, i);
                    }catch(e){ }
                }
            }

            // Add to list of all cloned objects
            circularResolved[context] = child;
        }else{
            child = parent; //Just a simple shallow copy will do
        }
        return child;
    }

    var i;
    if (circular) {
        var cloned = _clone(parent, '*');

        // Now this object has been cloned. Let's check to see if there are any
        // circular references for it
        for(i in circularReplace) {
            var c = circularReplace[i];
            if (c && c.child && c.i in c.child) {
                c.child[c.i] = circularResolved[c.resolveTo];
            }
        }
        return cloned;
    } else {
        // Deep clone all properties of parent into child
        var child;
        if (typeof parent === 'object') {
            if (parent === null){
                return parent;
            }
            if (parent.constructor.name === 'Array') {
                child = [];
                for(i in parent){
                    child[i] = clone(parent[i], circular);
                }
            }else if (util.isDate(parent)){
                child = new Date(parent.getTime() );
            }else if (util.isRegExp(parent)){
                child = new RegExp(parent.source);
            }else {
                child = {};
                //MLM: Not needed:
                //child.__proto__ = parent.__proto__;
                for(i in parent){ 
                    child[i] = clone(parent[i], circular);
                }
            }
        }else{ 
            child = parent; // Just a simple shallow clone will do
        }
        return child;
    }
}

var objectToString = function(o) {
    return Object.prototype.toString.call(o);
};

var util = {
    isArray: function (ar) {
        return Array.isArray(ar) || (typeof ar === 'object' && objectToString(ar) === '[object Array]');
    },
    isDate: function (d) {
        return typeof d === 'object' && objectToString(d) === '[object Date]';
    },
    isRegExp: function (re) {
        return typeof re === 'object' && objectToString(re) === '[object RegExp]';
    }
};
