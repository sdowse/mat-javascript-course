/**
 * Page Object for the 'add product' page
 * @constructor
 */

 var AddProductPage = function(){

/**
 * Elements on the page
 * */
    this.productName =$('#mat-input-0');
    this.productDescription = $('#mat-input-1');
    this.productPrice =$('#mat-input-2');
    this.submitButton =$('[type=submit]');
};
module.exports = new AddProductPage();