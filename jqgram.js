
require("setimmediate");
var Node = require("./lib/node.js");
var Profile = require("./lib/profile.js");

(function(exports, undefined){

    var setImmediate = !!setImmediate ? setImmediate : function(fn){setTimeout(fn,0); };

    exports.jqgram = {
        distance: function(roota, rootb, opts, cb) {
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
        Node: Node,
        Profile: Profile
    };


})(typeof exports === 'undefined' ? this.jqgram = {} : exports);


