class Product {
    constructor(id, type, name, version, color) {
        //breaking change: this.uuid = id;
        this.id = id;
        this.type = type;
        this.name = name;
        this.version = version;
        this.color = color;
    }
}

module.exports = Product;