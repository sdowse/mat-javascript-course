'use strict';

import { browser } from "protractor";

var World = function World() {

    // empty test data for our product
    this.product = undefined;

    // function to open browser and go to website
    this.openWebsite = function() {

        // bug fix so protractor works with cucumber
        browser.waitForAngularEnabled(false);

        // open website
        return browser.get('');
    }
};

module.exports.World = World;