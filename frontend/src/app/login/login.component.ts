import { Component, OnInit } from '@angular/core';
import { Route, Router } from '@angular/router';
import { take } from 'rxjs';
import { CommonService } from '../services/common.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  constructor(public commonService: CommonService, public router: Router) { }

  otpVerification = false;
  name = "";
  email = "";
  userName = "";
  password = "";
  sUserName = "";
  sPassword = "";
  confirmSPassword = "";
  loading = false;
  otp = "";

  ngOnInit(): void {
    this.commonService.routeName = 'login';
    if (this.commonService.getToken() !== null) {
      this.router.navigate(['recommender'])
    }
  }

  ngAfterViewInit() {
    this.loginText = <HTMLElement>document.querySelector(".title-text .login");
    this.loginForm = <HTMLElement>document.querySelector("form.login");
    this.loginBtn = document.querySelector("label.login");
    this.signupBtn = document.querySelector("label.signup");
    this.signupLink = document.querySelector("form .signup-link a");
  }

  loginText = <HTMLElement>document.querySelector(".title-text .login");
  loginForm = <HTMLElement>document.querySelector("form.login");
  loginBtn = document.querySelector("label.login");
  signupBtn = <HTMLElement>document.querySelector("label.signup");
  signupLink = document.querySelector("form .signup-link a");



  login() {
    this.loginForm.style.marginLeft = "0%";
    this.loginText.style.marginLeft = "0%";
  }

  signUp() {
    this.signupBtn.click();
    this.loginForm.style.marginLeft = "-50%";
    this.loginText.style.marginLeft = "-50%";
  }


  finalLogin() {
    this.commonService.loginSubscription({ "username": this.userName, "password": this.password }).pipe(take(1)).subscribe((response) => {
      console.log('hheelloo');
      this.router.navigate(['recommender'])
    })

  }

  finalSignUp() {
    this.commonService.emailSubscription({ "email": this.email }).pipe(take(1)).subscribe((response) => {
      // console.log('hheelloo');
      // this.router.navigate(['recommender'])
      if (response) {
        this.commonService.userNameSubscription({ "username": this.sUserName }).pipe(take(1)).subscribe((response2) => {
          if (response2) {
            this.otpVerification = true;
            this.commonService.generateOtp({ "email": this.email }).pipe(take(1)).subscribe((response3) => {
              if (response3) {
                console.log("otp sent to email")
              }
            })
          }
        })
      }
    })
    // fetch('http:')
  }

  finalValidate() {
    this.loading = true;
    this.commonService.checkOTP({ "email": this.email, 'otp': this.otp }).pipe(take(1)).subscribe((response2) => {
      if (response2) {
        this.commonService.finalSignup({ "email": this.email, 'username': this.sUserName, "password": this.sPassword, "name": this.name }).pipe(take(1)).subscribe((response3) => {
          if (response3) {
            this.router.navigate(['recommender']);
          }
        })
      }
    })
  }

}
