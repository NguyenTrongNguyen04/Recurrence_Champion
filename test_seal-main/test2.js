class ProductManager {

  constructor() {

    this.products = [];

  }
  addProduct(product) {

    this.products.push(product);

  }
  getProductById(id) {

    return this.products.find(p => p.id == id);

  }
  deleteProduct(id) {

    this.products.filter(p => p.id !== id);

  }

  updatePrice(id, newPrice) {

    const product = this.getProductById(id);

    if (product) {

      product.price = newPrice;

      return true;

    }
    return false;

  }

  getTotalInventoryValue() {
    return this.products.reduce((total, product) => total + product.price, 0);

  }

}

const pm = new ProductManager();

pm.addProduct({ id: 1, name: 'Laptop', price: 1000, quantity: 5 });
pm.addProduct({ id: 2, name: 'Phone', price: 500, quantity: 10 });

console.log(pm.getTotalInventoryValue());