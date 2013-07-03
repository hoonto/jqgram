// # JQGram

// Utilizes setImmediate if available, otherwise falls back to setTimeout
require("setimmediate");
// ## node.js
// Defines a Node of a tree as containing a label and an array of children.
var Node = require("./lib/node.js");
// ## profile.js 
// The guts of the pq-gram algorithm
var Profile = require("./lib/profile.js");
// ## shiftregister.js
// Convenience for profile.js and differs slightly from the Python PyGram implementation from which jqgram was originally ported.
var ShiftRegister = require("./lib/shiftregister.js");

(function(exports, undefined){

    var setImmediate = !!setImmediate ? setImmediate : function(fn){setTimeout(fn,0); };

    // ## jqgram
    // The jqgram object exposes one method and three constructors, however in typical usage, only the distance method is used.  Node, Profile, and ShiftRegister are however exposed for custom requirements.

    exports.jqgram = {
    // ### distance
    // Allows easy generation of two profiles defined by root nodes, and returns the resulting pq-gram edit distance approximation.
    // Please see the examples on github for more details on how to use the distance function to define the trees, the p and q options, and the callback (cb) function that is provided with the resulting pq-gram edit distance.
    
    // * roota: An object that contains the root of the first tree with the lfn (label callback function) and cfn (child callback function) defined.
    // * rootb: An object that represents the root of the second tree with the lfn (label callback function) and cfn (child callback function) defined.
    // * opts (optional): An object that contains p and q values, default: "{p: 2, q: 3}"
    // * cb: the callback function that will be executed with one argument, an object with a property "distance" that contains a float value between 0.0 and 1.0 representing the pq-gram edit distance  approximation between the trees rooted at roota and rootb.
        distance: function(roota, rootb, opts, cb) {
            if(typeof opts === 'function') cb = opts, opts = {};
            opts.p = opts.p || 2;
            opts.q = opts.q || 3;
            setImmediate(function() {
                var nodea = new Node(roota.root,roota.lfn,roota.cfn);
                var nodeb = new Node(rootb.root,rootb.lfn,rootb.cfn);
                var profa = new Profile(nodea, opts.p, opts.q);
                var profb = new Profile(nodeb, opts.p, opts.q);
                cb({ "distance": profa.edit_distance(profb) });
            });
        },
        //    * Node: allow creation of basic nodes with labels and children
        Node: Node,
        //    * Profile: allows edit_distances to be determined between manuallly created profiles 
        Profile: Profile,
        //    * ShiftRegister: mainly exposed for test cases, not typically used by developers
        ShiftRegister: ShiftRegister
    };


// allow jqgram to be utilized in browser or node environments:
})(typeof exports === 'undefined' ? this.jqgram = {} : exports);


