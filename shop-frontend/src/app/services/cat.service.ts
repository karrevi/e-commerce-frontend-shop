import { Injectable } from "@angular/core";
import { ProductService } from "./product.service";
import { BehaviorSubject } from "rxjs";
import { CartModelPublic, CartModelServer } from "../models/cart.model";
import { ProductModelServer } from "../models/product.model";
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { NavigationExtras, Router } from "@angular/router";
import { OrderService } from "./order.service";
import { NgxSpinnerService } from "ngx-spinner";
import { ToastrService } from "ngx-toastr";

@Injectable({ providedIn: "root" })
export class CatService {
  private serverURl = environment.SERVER_URL;

  //   Data variable to store the cart information on the client's local storage
  private cartDataClient: CartModelPublic = {
    prodData: [
      {
        id: 0,
        incart: 0,
      },
    ],
    total: 0,
  };

  //   Data variable to store cart information on the server

  private cartDataServer: CartModelServer = {
    data: [
      {
        product: undefined,
        numInCart: 0,
      },
    ],
    total: 0,
  };
  //OBSERVABLES FOR THE COMPONENTS TO SUBSCRIBE
  cartTotal$ = new BehaviorSubject<number>(0);
  cartDataObs$ = new BehaviorSubject<CartModelServer>(this.cartDataServer);

  constructor(
    private httpClient: HttpClient,
    private productService: ProductService,
    private orderService: OrderService,
    private router: Router,
    private spinner: NgxSpinnerService,
    private toast: ToastrService
  ) {
    this.cartTotal$.next(this.cartDataServer.total);
    this.cartDataObs$.next(this.cartDataServer);

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
              this.CalculateTotal();
              this.cartDataServer.total = this.cartDataServer.total;
              localStorage.setItem("cart", JSON.stringify(this.cartDataServer));
            } else {
              this.cartDataServer.data.push({
                numInCart: p.incart,
                product: actualProductInfo,
              });
              this.CalculateTotal();
              this.cartDataClient.total = this.cartDataServer.total;
              localStorage.setItem("cart", JSON.stringify(this.cartDataClient));
            }
            this.cartDataObs$.next({ ...this.cartDataServer });
          });
      });
    }
  }
  CalculateSubTotal(index): Number {
    let subTotal = 0;
    let p = this.cartDataServer.data[index];
    subTotal = p.product.price * p.numInCart;
    return subTotal;
  }

  AddProductToCart(id: number, quantity?: number) {
    this.productService.getSingleProduct(id).subscribe((prod) => {
      if (this.cartDataServer.data[0].product === undefined) {
        this.cartDataServer.data[0].product = prod;
        this.cartDataServer.data[0].numInCart =
          quantity !== undefined ? quantity : 1;
        this.CalculateTotal();
        this.cartDataClient.prodData[0].incart = this.cartDataServer.data[0].numInCart;
        this.cartDataClient.prodData[0].id = prod.id;
        this.cartDataClient.total = this.cartDataServer.total;
        localStorage.setItem("cart", JSON.stringify(this.cartDataClient));
        this.cartDataObs$.next({ ...this.cartDataServer });
        this.toast.success(`${prod.name} added to the cart.`, "Product Added", {
          timeOut: 1500,
          progressBar: true,
          progressAnimation: "increasing",
          positionClass: "toast-top-right",
        });
      } else {
        let index = this.cartDataServer.data.findIndex(
          (p) => p.product.id === prod.id
        );
        if (index !== -1) {
          if (quantity !== undefined && quantity <= prod.quantity) {
            // @ts-ignore
            this.cartDataServer.data[index].numInCart =
              this.cartDataServer.data[index].numInCart < prod.quantity
                ? quantity
                : prod.quantity;
          } else {
            // @ts-ignore
            this.cartDataServer.data[index].numInCart < prod.quantity
              ? this.cartDataServer.data[index].numInCart++
              : prod.quantity;
          }

          this.cartDataClient.prodData[index].incart = this.cartDataServer.data[
            index
          ].numInCart;
          this.toast.info(
            `${prod.name} quantity updated in the cart.`,
            "Product Updated",
            {
              timeOut: 1500,
              progressBar: true,
              progressAnimation: "increasing",
              positionClass: "toast-top-right",
            }
          );
        } else {
          this.cartDataServer.data.push({
            numInCart: 1,
            product: prod,
          });
          this.cartDataClient.prodData.push({
            incart: 1,
            id: prod.id,
          });
          this.toast.success(
            `${prod.name} added to the cart.`,
            "Product Added",
            {
              timeOut: 1500,
              progressBar: true,
              progressAnimation: "increasing",
              positionClass: "toast-top-right",
            }
          );
        }
        this.CalculateTotal();
        this.cartDataClient.total = this.cartDataServer.total;
        localStorage.setItem("cart", JSON.stringify(this.cartDataClient));
        this.cartDataObs$.next({ ...this.cartDataServer });
      }
    });
  }

  UpdateCartItems(index: number, increase: boolean) {
    let data = this.cartDataServer.data[index];

    if (increase) {
      // @ts-ignore
      data.numInCart < data.product.quantity
        ? data.numInCart++
        : data.product.quantity;
      this.cartDataClient.prodData[index].incart = data.numInCart;
      this.CalculateTotal();
      this.cartDataClient.total = this.cartDataServer.total;
      this.cartDataObs$.next({ ...this.cartDataServer });
      localStorage.setItem("cart", JSON.stringify(this.cartDataClient));
    } else {
      // @ts-ignore
      data.numInCart--;

      // @ts-ignore
      if (data.numInCart < 1) {
        this.DeleteProductFromCart(index);
        this.cartDataObs$.next({ ...this.cartDataServer });
      } else {
        // @ts-ignore
        this.cartDataObs$.next({ ...this.cartDataServer });
        this.cartDataClient.prodData[index].incart = data.numInCart;
        this.CalculateTotal();
        this.cartDataClient.total = this.cartDataServer.total;
        localStorage.setItem("cart", JSON.stringify(this.cartDataClient));
      }
    }
  }
  DeleteProductFromCart(index: number) {
    if (window.confirm("Are you sure you want to remove the item")) {
      this.cartDataServer.data.splice(index, 1);
      this.cartDataClient.prodData.splice(index, 1);
      this.CalculateTotal();
      this.cartDataClient.total = this.cartDataServer.total;
      if (this.cartDataClient.total === 0) {
        this.cartDataClient = { total: 0, prodData: [{ incart: 0, id: 0 }] };
        localStorage.setItem("cart", JSON.stringify(this.cartDataClient));
      } else {
        localStorage.setItem("cart", JSON.stringify(this.cartDataClient));
      }
      if (this.cartDataServer.total === 0) {
        this.cartDataServer = {
          data: [{ numInCart: 0, product: undefined }],
          total: 0,
        };
        this.cartDataObs$.next({ ...this.cartDataServer });
      } else {
        this.cartDataObs$.next({ ...this.cartDataServer });
      }
    } else {
      return;
    }
  }
  private CalculateTotal() {
    let Total = 0;

    this.cartDataServer.data.forEach((p) => {
      const { numInCart } = p;
      const { price } = p.product;

      Total += numInCart * price;
    });
    this.cartDataServer.total = Total;
    this.cartTotal$.next(this.cartDataServer.total);
  }
  CheckoutFromCart(userId: number) {
    this.httpClient
      .post(`${this.serverURl}/orders/payment`, null)
      .subscribe((res: { success: boolean }) => {
        if (res.success) {
          this.resetServerData();
          this.httpClient
            .post(`${this.serverURl}/orders/new`, {
              userId: userId,
              products: this.cartDataClient.prodData,
            })
            .subscribe((data: OrderConfirmationResponse) => {
              this.orderService.getSingleOrder(data.order_id).then((prods) => {
                if (data.success) {
                  const navigationExtras: NavigationExtras = {
                    state: {
                      message: data.message,
                      products: prods,
                      orderId: data.order_id,
                      total: this.cartDataClient.total,
                    },
                  };
                  this.spinner.hide().then();
                  this.router
                    .navigate(["/thankyou"], navigationExtras)
                    .then((p) => {
                      this.cartDataClient = {
                        total: 0,
                        prodData: [{ incart: 0, id: 0 }],
                      };
                      this.cartTotal$.next(0);
                      localStorage.setItem(
                        "cart",
                        JSON.stringify(this.cartDataClient)
                      );
                    });
                }
              });
            });
        } else {
          this.spinner.hide().then();
          this.router.navigateByUrl("/checkout").then();
          this.toast.error(`Sorry, failed to book the order`, "Order Status", {
            timeOut: 1500,
            progressBar: true,
            progressAnimation: "increasing",
            positionClass: "toast-top-right",
          });
        }
      });
  }
  private resetServerData() {
    this.cartDataServer = {
      total: 0,
      data: [
        {
          numInCart: 0,
          product: undefined,
        },
      ],
    };
    this.cartDataObs$.next({ ...this.cartDataServer });
  }
}
interface OrderConfirmationResponse {
  order_id: number;
  success: boolean;
  message: string;
  products: [
    {
      id: string;
      numInCart: string;
    }
  ];
}
