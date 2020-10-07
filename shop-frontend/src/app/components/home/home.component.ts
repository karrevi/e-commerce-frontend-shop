import { Component, OnInit } from "@angular/core";
import { ProductService } from "src/app/services/product.service";
import {
  ProductModelServer,
  ServerResponse,
} from "src/app/models/product.model";
import { CatService } from "src/app/services/cat.service";
import { Router } from "@angular/router";

@Component({
  selector: "mg-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})
export class HomeComponent implements OnInit {
  products: ProductModelServer[] = [];

  constructor(
    private productService: ProductService,
    private catService: CatService,
    private router: Router
  ) {}

  ngOnInit() {
    this.productService.getAllProducts(8).subscribe((prods: ServerResponse) => {
      this.products = prods.products;
      console.log(this.products);
    });
  }
  AddProduct(id: any) {
    this.catService.AddProductToCart(id);
  }
  selectProduct(id: Number) {
    this.router.navigate(["/product", id]).then();
  }
}
