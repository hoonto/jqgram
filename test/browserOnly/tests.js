"use strict";
/*global jqunit: false, specify: false, window: false */

function assert(condition) {
    if (!condition) {
        throw new Error("Assertion failed");
    }
}
assert.strictEqual = function (x, y) {
    if (x !== y) {
        throw new Error(x + " !== " + y);
    }
};

specify("Profile Equality", function(done) {
    assert(!false);
    done();
});

specify("Profile Equality 2", function (done) {
    assert.strictEqual("TEST", "TEST");
    done();
});
