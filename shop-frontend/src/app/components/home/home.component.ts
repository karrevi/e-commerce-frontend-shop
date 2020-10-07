import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import {
  ProductModelServer,
  ServerResponse,
} from "src/app/models/product.model";
import { CatService } from "src/app/services/cat.service";
import { ProductService } from "src/app/services/product.service";

@Component({
  selector: "app-home",
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

  ngOnInit(): void {
    this.productService.getAllProducts().subscribe((prods: ServerResponse) => {
      this.products = prods.products;
    });
  }
  selectProduct(id: Number) {
    this.router.navigate(["/product", id]).then();
  }
  AddToCart(id: any) {
    this.catService.AddProductToCart(id);
  }
}
