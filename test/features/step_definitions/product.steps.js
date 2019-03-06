const { Given, When, Then, Before } = require('cucumber');
const { setWorldConstructor } = require('cucumber');
const CustomWorld = require('../support/world').World;

setWorldConstructor(CustomWorld);

// Cucumber before 'hook'
Before(function () {
    this.openWebsite()

});

Given('a product doesn\'t exist', function (dataTable) {
    return 'pending';
});

When('I add the product', function () {
    return 'pending';
});

Then('the product is created', function () {
    return 'pending';
});