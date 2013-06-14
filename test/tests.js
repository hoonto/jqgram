"use strict";
/*global jqgram: false, clearImmediate: false, specify: false, window: false */

var assert = require("assert");
var jqgram = require("../jqgram").jqgram;
var kcombo = require('./kcombinations').combos.k_combinations;

var Node = jqgram.Node;
var Profile = jqgram.Profile;
var ShiftRegister = jqgram.ShiftRegister;
var distance = jqgram.distance;

var lfn = function(node) {
    return node.tedlabel;
}
var cfn = function(node) {
    return node.tedchildren;
}

function runProfileTests() {
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
        this.timeout(1000*60*5);
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
        this.timeout(1000*60*5);
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
        this.timeout(1000*60*5);
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
        this.timeout(1000*60*5);
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
        this.timeout(1000*60*5);
        // x.edit_distance(x) should always be 0
        for(var i=0; i<profiles.length; i++){
            var p1 = profiles[i];
            assert.strictEqual(p1.edit_distance(p1), 0);
        }
        done();
    });
}

function runRegisterTests() {
     specify("Register creation", function(done){
        this.timeout(1000*60*5);
        // should create a register of the given size filled with '*'
        var sizes = [];
        for(var i=0; i<10; i++){
            sizes.push(randint(1,50));
        }
        for(var j=0; j<sizes.length; j++){
            var size = sizes[j];
            var reg = new ShiftRegister(size);
            assert.strictEqual(size === reg.len(), true);
            for(var k=0; k<reg.len(); k++){
                var item = reg.register[k]
                assert.strictEqual(item === "*", true);
            }
        }
        done();
    });

     specify("Register concatenation", function(done){
        this.timeout(1000*60*5);
        // concatenate should return the union of the two registers as an array
        var reg_one = new ShiftRegister(2);
        reg_one.shift("a");
        reg_one.shift("b");
        var reg_two = new ShiftRegister(3);
        reg_two.shift("c");
        reg_two.shift("d");
        reg_two.shift("e");
        var reg_cat = reg_one.concatenate(reg_two);
        assert.strictEqual(reg_cat.join('') === "abcde", true);
        done();
    });

    specify("Register shift", function(done){
        this.timeout(1000*60*5);
        // shift removes item from the left and adds a new item to the right
        var reg = new ShiftRegister(3);
        reg.register[0] = "a";
        reg.register[1] = "b";
        reg.register[2] = "c";
        reg.shift("d");
        assert.strictEqual(reg.register[0] === "b", true);
        assert.strictEqual(reg.register[1] === "c", true);
        assert.strictEqual(reg.register[2] === "d", true);
        done();
    });


}


function runBlackBoxTests() {

    specify("Result tests", function(done){
        this.timeout(1000*60*5);
        var t1 = {
            "name": "a", 
            "kiddos": [
                { "name": "b", 
                "kiddos": [
                        { "name": "c" },
                        { "name": "d" }
                    ]
                },
                { "name": "e" },
                { "name": "f" }
            ]
        }

        var t2 = {
            "name": "a", 
            "kiddos": [
                { "name": "b", 
                "kiddos": [
                        { "name": "c" },
                        { "name": "d" }
                    ]
                },
                { "name": "e" }, 
                { "name": "x" }
            ]
        }

        var t3 = {
            "name": "a", 
            "kiddos": [
                { "name": "b", 
                "kiddos": [
                        { "name": "j" }
                    ]
                },
                { "name": "e" },
                { "name": "f" }
            ]
        }

        var t4 = {
            "name": "a", 
            "kiddos": [
                { "name": "b", 
                "kiddos": [
                        { "name": "c" },
                    ]
                },
                { "name": "e" },
                { "name": "f" }
            ]
        }

        var t5 = {
            "name": "a", 
            "kiddos": [
                { "name": "b" }, 
                { "name": "e" },
                { "name": "f" }
            ]
        }

        var t6 = {
            "name": "b", 
            "kiddos": [
                { "name": "n" }, 
                { "name": "e" },
                { "name": "g" }
            ]
        }

        var t7 = {
            "name": "b", 
            "kiddos": [
                { "name": "n" }, 
                { "name": "e" },
                { "name": "f",
                "kiddos": [
                    { "name": "g",
                    "kiddos": [
                        { "name": "h" }
                    ]
                    }
                ]
                }
            ]
        }

        var t8 = {
            "name": "a", 
            "kiddos": [
                { "name": "b" }, 
                { "name": "z" },
                { "name": "f",
                "kiddos": [
                    { "name": "g",
                    "kiddos": [
                        { "name": "h" }
                    ]
                    }
                ]
                }
            ]
        }

        var t9 = {
            "name": "a", 
            "kiddos": [
                { "name": "b" }, 
                { "name": "c" },
                { "name": "d" },
                { "name": "f", 
                "kiddos": [
                    { "name": "f",
                    "kiddos": [
                        { "name": "x" }
                    ]
                    }
                ]
                }
            ]
        }


        /*
        distance: function(roota, rootb, opts, cb) {
            setImmediate(function() {
                var nodea = new Node(roota.root,roota.lfn,roota.cfn,depth);
                var nodeb = new Node(rootb.root,rootb.lfn,rootb.cfn,depth);
                var profilea = new Profile(nodea);
                var profileb = new Profile(nodeb);
                cb({ "edit_distance": profilea.edit_distance(profileb) });
            });
        }
        */
        var results = [[
            parseFloat('0'),
            parseFloat('0.3076923076923077'),
            parseFloat('0.9166666666666666'),
            parseFloat('0.75'),
            parseFloat('0.9047619047619048'),
            parseFloat('1'),
            parseFloat('1'),
            parseFloat('0.9259259259259259'),
            parseFloat('0.9310344827586207')
        ],[
            parseFloat('0.3076923076923077'),
            parseFloat('0'),
            parseFloat('0.9166666666666666'),
            parseFloat('0.75'),
            parseFloat('0.9047619047619048'),
            parseFloat('1'),
            parseFloat('1'),
            parseFloat('0.9259259259259259'),
            parseFloat('0.9310344827586207')
        ],[
            parseFloat('0.9166666666666666'),
            parseFloat('0.9166666666666666'),
            parseFloat('0'),
            parseFloat('0.36363636363636365'),
            parseFloat('0.8947368421052632'),
            parseFloat('1'),
            parseFloat('1'),
            parseFloat('0.92'),
            parseFloat('0.9259259259259259')
        ],[
            parseFloat('0.75'),
            parseFloat('0.75'),
            parseFloat('0.36363636363636365'),
            parseFloat('0'),
            parseFloat('0.8947368421052632'),
            parseFloat('1'),
            parseFloat('1'),
            parseFloat('0.92'),
            parseFloat('0.9259259259259259')
        ],[
            parseFloat('0.9047619047619048'),
            parseFloat('0.9047619047619048'),
            parseFloat('0.8947368421052632'),
            parseFloat('0.8947368421052632'),
            parseFloat('0'),
            parseFloat('1'),
            parseFloat('1'),
            parseFloat('0.8181818181818181'),
            parseFloat('0.8333333333333334')
        ],[
            parseFloat('1'),
            parseFloat('1'),
            parseFloat('1'),
            parseFloat('1'),
            parseFloat('1'),
            parseFloat('0'),
            parseFloat('0.6363636363636364'),
            parseFloat('1'),
            parseFloat('1')
        ],[
            parseFloat('1'),
            parseFloat('1'),
            parseFloat('1'),
            parseFloat('1'),
            parseFloat('1'),
            parseFloat('0.6363636363636364'),
            parseFloat('0'),
            parseFloat('0.7142857142857143'),
            parseFloat('1')
        ],[
            parseFloat('0.9259259259259259'),
            parseFloat('0.9259259259259259'),
            parseFloat('0.92'),
            parseFloat('0.92'),
            parseFloat('0.8181818181818181'),
            parseFloat('1'),
            parseFloat('0.7142857142857143'),
            parseFloat('0'),
            parseFloat('0.8666666666666667')
        ],[
            parseFloat('0.9310344827586207'),
            parseFloat('0.9310344827586207'),
            parseFloat('0.9259259259259259'),
            parseFloat('0.9259259259259259'),
            parseFloat('0.8333333333333334'),
            parseFloat('1'),
            parseFloat('1'),
            parseFloat('0.8666666666666667'),
            parseFloat('0')
        ]];

        var roots = [t1, t2, t3, t4, t5, t6, t7, t8, t9];
        for(var i=0,ic=0; i<roots.length; i++){
            for(var j=0,jc=0; j<roots.length; j++){
                distance({
                    root: roots[i], 
                    lfn: function(node){ return node.name; },
                    cfn: function(node){ return node.kiddos; }
                },{
                    root: roots[j],
                    lfn: function(node){ return node.name; },
                    cfn: function(node){ return node.kiddos; }
                },{ p:2, q:3, depth:10 },
                function(result) { 
                    assert.strictEqual(results[ic][jc++] === result.distance, true);
                    if(jc%9 == 0){ ic++; jc=0; }

                    if(ic == 9 && jc == 0) done();

                });
            }
        }
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
    //for(var x=0; x<depth; x++){
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
    //}
    return root;
}

runProfileTests();
runRegisterTests();
runBlackBoxTests();


