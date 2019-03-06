/**
 * Page Object for the 'add product' page
 * @constructor
 */

 var AddProductPage = function(){

/**
 * Elements on the page
 * */
    this.productName =$('#mat-input-0');
    this.product.Description = $('#mat-input-1');
    this.product.Price =$('#mat-input-2');
    this.submit.Button =$('[type=submit]');
};
module.exports = new AddProductPage();