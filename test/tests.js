"use strict";
/*global jqgram: false, clearImmediate: false, specify: false, window: false */

var assert = require("assert");
var jqgram = require("../jqgram").jqgram;
var kcombo = require('./kcombinations').combos.k_combinations;

var Node = jqgram.Node;
var Profile = jqgram.Profile;
var distance = jqgram.distance;

var lfn = function(node) {
    return node.tedlabel;
}
var cfn = function(node) {
    return node.tedchildren;
}

function runTests() {
    var p = 2;
    var q = 3;
    var num_random = 10;
    var trees = [];
    var profiles = [];

    var small_tree1 = new Node("a",lfn,cfn);
    var small_tree2 = new Node("b",lfn,cfn);
    trees.push(small_tree1);
    trees.push(small_tree2);
    var small_profile1 = [['*','a','*','*','*']];
    var small_profile2 = [['*','b','*','*','*']];

    var known_tree1 = (new Node("a",lfn,cfn).addkid(new Node("a",lfn,cfn).addkid(new Node("e",lfn,cfn)).addkid(new Node("b",lfn,cfn))).addkid(new Node("b",lfn,cfn)).addkid(new Node("c",lfn,cfn)));

    var known_tree2 = (new Node("a",lfn,cfn).addkid(new Node("a",lfn,cfn).addkid(new Node("e",lfn,cfn)).addkid(new Node("b",lfn,cfn))).addkid(new Node("b",lfn,cfn)).addkid(new Node("x",lfn,cfn)));

    trees.push(known_tree1);
    trees.push(known_tree2);

    var known_profile1 = [['*','a','*','*','a'],['a','a','*','*','e'],['a','e','*','*','*'],['a','a','*','e','b'],['a','b','*','*','*'],['a','a','e','b','*'],['a','a','b','*','*'],['*','a','*','a','b'],['a','b','*','*','*'],['*','a','a','b','c'],['a','c','*','*','*'],['*','a','b','c','*'],['*','a','c','*','*']];

    var known_profile2 = [['*','a','*','*','a'],['a','a','*','*','e'],['a','e','*','*','*'],['a','a','*','e','b'],['a','b','*','*','*'],['a','a','e','b','*'],['a','a','b','*','*'],['*','a','*','a','b'],['a','b','*','*','*'],['*','a','a','b','x'],['a','x','*','*','*'],['*','a','b','x','*'],['*','a','x','*','*']];

    var known_edit_distance = 0.31;

    for(var i=0; i<num_random; i++){
        var depth = randint(1,10);
        var width = randint(1, 5);
        trees.push(randtree({depth:depth,width:width,repeat:4}));
    }

    for(var j=0; j<trees.length; j++){
        if(!trees[j].tedchildren) console.log('WSTF!');
        var blah = trees[j].tedchildren;
        profiles.push(new Profile(trees[j],p,q));
    }

    specify("Profile creation and equality", function(done) {
        // Tests the creation of profiles against known profiles.
        var small_tree1_equality = checkProfileEquality(profiles[0], small_profile1);
        var small_tree2_equality = checkProfileEquality(profiles[1], small_profile2);
        var known_tree1_equality = checkProfileEquality(profiles[2], known_profile1);
        var known_tree2_equality = checkProfileEquality(profiles[3], known_profile2);

        assert.strictEqual(small_tree1_equality, true);
        assert.strictEqual(small_tree2_equality, true);
        assert.strictEqual(known_tree1_equality, true);
        assert.strictEqual(known_tree2_equality, true);
        
        done();
    });

    specify("Symmetry", function(done){
        // x.edit_distance(y) should be the same as y.edit_distance(x)
        for(var i=0; i<profiles.length; i++){
            for(var j=0; j<profiles.length; j++){
                var p1 = profiles[i];
                var p2 = profiles[j];
                var dist1 = p1.edit_distance(p2);
                var dist2 = p2.edit_distance(p1);
                assert.strictEqual(dist1 === dist2, true);
            }
        }
        done();
    });

    specify("Edit distance boundaries", function(done){
        // x.edit_distance(y) should always return a value between 0 and 1
        for(var i=0; i<profiles.length; i++){
            for(var j=0; j<profiles.length; j++){
                var p1 = profiles[i];
                var p2 = profiles[j];
                var dist = p1.edit_distance(p2);
                assert.strictEqual((dist <= 1.0 && dist >= 0), true);
            }
        }
        done();
    });

    specify("Triangle inequality", function(done){
        // The triangle inequality should hold true for any three trees
        for(var i=0; i<profiles.length; i++){
            for(var j=0; j<profiles.length; j++){
                for(var k=0; k<profiles.length; k++){
                    var p1 = profiles[i];
                    var p2 = profiles[j];
                    var p3 = profiles[k];
                    var t1 = (p1.edit_distance(p3) <= p1.edit_distance(p2) + p2.edit_distance(p3));
                    assert.strictEqual(t1,true);
                }
            }
        }
        done();
    });

    specify("Identity", function(done){
        // x.edit_distance(x) should always be 0
        for(var i=0; i<profiles.length; i++){
            var p1 = profiles[i];
            assert.strictEqual(p1.edit_distance(p1), 0);
        }
        done();
    });


}

function arrayEquals(a, b){
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;

    for (var i = 0; i < a.length; ++i) {
        if(Object.prototype.toString.call(a[i]) === '[object Array]' &&
           Object.prototype.toString.call(b[i]) === '[object Array]'){
            if(!arrayEquals(a[i],b[i])) return false;
        }else{
            if(a[i] !== b[i]) return false;
        }
    }
    return true;
}

function randint(low,high){
    return Math.floor(Math.random()*(high-low+1)+low);
}

function fisherYates ( myArray ) {
  var i = myArray.length, j, temp;
  if ( i === 0 ) return false;
  while ( --i ) {
     j = Math.floor( Math.random() * ( i + 1 ) );
     temp = myArray[i];
     myArray[i] = myArray[j]; 
     myArray[j] = temp;
   }
}

function checkProfileEquality(profile1, profile2){
    return arrayEquals(profile1.list, profile2);
}

// { depth:2, alpha:'abcdefghijklmnopqrstuvwxyz', repeat:2, width:2 }
function randtree(opts){
    var labelpos = 0;
    var depth = opts.depth || 2;

    var alpha = opts.alpha || 'abcdefghijklmnopqrstuvwxyz';
    var repeat = opts.repeat || 2;
    var width = opts.width || 2;

    var labels = kcombo('abcdefghijklmnopqrstuvwxyz', 4);
    fisherYates(labels)
    var root = new Node("root",lfn,cfn);
    var p = [root];
    var c = [];
    for(var x=0; x<depth; x++){
        for(var y=0; y<p.length; y++){
            var py = p[y];
            var randrange = randint(1,1+width);
            for(var z=0; z<randrange; z++){
                if(labelpos >= labels.length) labelpos = 0;
                var n = new Node(labels[labelpos++],lfn,cfn);
                py.addkid(n);
                c.push(n);
            }
        }
        p = c;
        c = [];
    }
    return root;
}




runTests();

//assert(!false);
//assert.strictEqual("TEST", "TEST");


////////////////////////////////////////////////////
/*
console.log('document keys!');
    self.docclone = new TED().clone(document,true);
    console.log('document.location == ' + self.docclone.location);
    console.log('document.location.href == ' + self.docclone.location.href);
    self.docclone.location.href = 'http://this.is.cool';
    console.log('document.location.href now == ' + self.docclone.location.href);
    //var divclone = docclone.createElement('div');
    console.log('typeof docclone == ' + typeof self.docclone);
    console.log('typeof docclone.getElementsByTagName == ' + typeof self.docclone.getElementsByTagName);
    var bodylist = self.docclone.getElementsByTagName('BODY');
    console.log('bodylist == ' + bodylist.length);




                        var seekroot2 = function(troot,iroots){
                            var t = TED();
                            var trootlen = troot.find('*').length;
                            //console.log('troot.length == ' + trootlen);

                            var bestedit = Number.MAX_VALUE;
                            if(iroots && iroots.length > 0){
                                var besti = iroots[0];
                                var bestited;
                                for(var i=0; i<iroots.length; i++){
                                    var iroot = iroots[i];
                                    var irootlen = $(iroot).find('*').length;
                                    //console.log(irootlen);
                                    //var rootr = trootlen / irootlen;
                                    //console.log('rootr == ' + rootr);
                                    //if(trootlen > 3 && irootlen > 3 && rootr == 1){ 
                                        var total = t.TEdit({
                                            root: troot[0],
                                            lfn: function(node){
                                                return node.name;
                                            },
                                            cfn: function(node){
                                                var retarr = [];
                                                if(!! node.attribs &&
                                                    !! node.attribs.class){
                                                    retarr = retarr.concat(node.attribs.class.split(' '));
                                                }
                                                if(!! node.attribs && 
                                                    !! node.attribs.id){
                                                    retarr.push(node.attribs.id);
                                                }
                                                retarr = retarr.concat(node.children);
                                                return retarr;
                                            }
                                        },{
                                            root: iroot,
                                            lfn: function(node) {
                                                return node.nodeName.toLowerCase();
                                            },
                                            cfn: function(node) {
                                                var retarr = [];
                                                if(!! node.attributes &&
                                                !! node.attributes.class &&
                                                !! node.attributes.class.nodeValue){
                                                    retarr = retarr.concat(node.attributes.class.nodeValue.split(' '));
                                                }
                                                if(!! node.attributes &&
                                                !! node.attributes.id &&
                                                !! node.attributes.id.nodeValue) {
                                                    retarr.push(node.attributes.id.nodeValue);
                                                }
                                                for(var i=0; i<node.children.length; i++){
                                                    retarr.push(node.children[i]);
                                                }
                                                return retarr;
                                            }
                                        },1,1,Number.MAX_VALUE);

                                        if(total < bestedit){
                                            //console.log('^^ chosen ^^');
                                            bestedit = total;
                                            besti = iroot;
                                        }
                                    //}
                                }
                                //console.log('--- final ited: ');
                                //console.log(appAPI.JSON.stringify(bestited));
                                
                                return $(besti);
                            }
                        }
*/





