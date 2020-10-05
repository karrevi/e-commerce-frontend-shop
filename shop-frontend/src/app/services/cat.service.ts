import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ProductService } from "./product.service";
import { OrderService } from "./order.service";
import { environment } from "src/environments/environment";
import { CartModelPublic, CartModelServer } from "../models/cart.model";
import { BehaviorSubject } from "rxjs";
import { Router } from "@angular/router";
import { ProductModelServer } from "../models/product.model";

@Injectable({ providedIn: "root" })
export class CartService {
  private serverURl = environment.SERVER_URL;

  //   Data variable to store the cart information on the client's local storage
  private cartDataClient: CartModelPublic = {
    total: 0,
    prodData: [
      {
        id: 0,
        incart: 0,
      },
    ],
  };

  //   Data variable to store cart information on the server

  private cartDataServer: CartModelServer = {
    total: 0,
    data: [
      {
        numInCart: 0,
        product: undefined,
      },
    ],
  };
  //OBSERVABLES FOR THE COMPONENTS TO SUBSCRIBE
  cartTotal$ = new BehaviorSubject<number>(0);
  cartData$ = new BehaviorSubject<CartModelServer>(this.cartDataServer);

  constructor(
    private http: HttpClient,
    private productService: ProductService,
    private orderService: OrderService,
    private router: Router
  ) {
    this.cartTotal$.next(this.cartDataServer.total);
    this.cartData$.next(this.cartDataServer);

    // GET THE INFORMATION FROM LOCAL STORAGE( IF ANY)
    let info: CartModelPublic = JSON.parse(localStorage.getItem("cart"));

    // Check if the info variable is null or has some data in it

    if (info !== null && info !== undefined && info.prodData[0].incart !== 0) {
      // Local Storage is not empty and some information
      this.cartDataClient = info;

      //   Loop through each entry and put it in the cartDataServer object
      this.cartDataClient.prodData.forEach((p) => {
        this.productService
          .getSingleProduct(p.id)
          .subscribe((actualProductInfo: ProductModelServer) => {
            if (this.cartDataServer.data[0].numInCart === 0) {
              this.cartDataServer.data[0].numInCart = p.incart;
              this.cartDataServer.data[0].product = actualProductInfo;
              //TODO Create CalculateTotal Function and replace it here
              this.cartDataServer.total = this.cartDataServer.total;
              localStorage.setItem("cart", JSON.stringify(this.cartDataServer));
            } else {
              // CartDataServer already has some entry in it
              this.cartDataServer.data.push({
                numInCart: p.incart,
                product: actualProductInfo,
              });
              //TODO Create CalculateTotal Function and replace it here
              this.cartDataClient.total = this.cartDataServer.total;
              localStorage.setItem("cart", JSON.stringify(this.cartDataClient));
            }
            this.cartData$.next({ ...this.cartDataServer });
          });
      });
    }
  }
  AddProductToCart(id: number, quantity: number) {
    this.productService.getSingleProduct(id).subscribe((prod) => {
      if (this.cartDataServer.data[0].product === undefined) {
        this.cartDataServer.data[0].product = prod;
        this.cartDataServer.data[0].numInCart =
          quantity !== undefined ? quantity : 1;
        this.cartDataClient.prodData[0].incart = this.cartDataServer.data[0].numInCart;
        this.cartDataClient.prodData[0].id = prod.id;
        this.cartDataClient.total = this.cartDataServer.total;
        localStorage.setItem("cart", JSON.stringify(this.cartDataClient));
        this.cartData$.next({ ...this.cartDataServer });
      } else {
        let index = this.cartDataServer.data.findIndex(
          (p) => p.product.id === prod.id
        );
        if (index !== -1) {
          if (quantity !== undefined && quantity <= prod.quantity) {
            this.cartDataServer.data[index].numInCart =
              this.cartDataServer.data[index].numInCart < prod.quantity
                ? quantity
                : prod.quantity;
          } else {
            this.cartDataServer.data[index].numInCart < prod.quantity
              ? this.cartDataServer.data[index].numInCart++
              : prod.quantity;
          }
        }
      }
    });
  }
}
