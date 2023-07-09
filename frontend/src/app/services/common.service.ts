import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, switchMap, take, throwError } from 'rxjs';
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  constructor(private http: HttpClient, public router: Router) { }

  public routeName = "";
  public token = "";

  getToken() {
    return localStorage.getItem('access_token');
  }

  doLogout() {
    let removeToken = localStorage.removeItem('access_token');
    if (removeToken == null) {
      this.token = '';
      this.router.navigate(['login']);
    }
  }

  loginSubscription(userData): Observable<any> {
    let url = `http://${environment.API_GATEWAY_DOMAIN}:3000/api/user/login`;
    let headers = new HttpHeaders({
      "Access-Control-Allow-Origin": "*",
      'Content-Type': 'application/json'
    });
    let options = { headers: headers };
    return this.http.post(url, userData, options).pipe(switchMap((res: any) => {
      // val = '';
      if (res.message === 'valid') {
        localStorage.setItem('access_topken', res['x-auth-token'])
        this.token = res['x-auth-token'];
        return of(res);
      }
      else {
        alert('wrong credentials');
        return throwError(() => new Error('wrong credentials'));
      }
    }));
  }

  movieRecommenderCall(URL, userData, extra?): Observable<any> {
    debugger;
    let url = URL;
    let headers = new HttpHeaders({
      "Access-Control-Allow-Origin": "*",
      'Content-Type': 'application/json',
      "Access-Control-Allow-Credentials": "true",
      "x-auth-token": this.token
    });
    let options = { headers: headers, params: userData };
    return this.http.get(url, options).pipe(switchMap((res: any) => {
      // val = '';
      console.log('res', res)
      return of(res);
      // if (res.message === 'valid') {
      //   this.token = res['x-auth-token'];
      //   return of(res);
      // }
      // else {
      //   alert('wrong credentials');
      //   return throwError(() => new Error('wrong credentials'));
      // }
    }));
  }

  uploadRatings(data): Observable<any> {
    let headers = new HttpHeaders({
      "Access-Control-Allow-Origin": "*",
      'Content-Type': 'application/json',
      "Access-Control-Allow-Credentials": "true",
      "x-auth-token": this.token
    });
    let options = { headers: headers };
    return this.http.post(`http://${environment.API_GATEWAY_DOMAIN}:3000/api/movie/review`, data, options).pipe(switchMap((res) => {
      return of(res);
    }))
  }

  getMovieDetails(url, data): Observable<any> {
    let headers = new HttpHeaders({
      "Access-Control-Allow-Origin": "*",
      'Content-Type': 'application/json',
      "Access-Control-Allow-Credentials": "true",
      "x-auth-token": this.token
    });
    let params = { 'movieID': data }
    let options = { headers: headers, params: params };
    return this.http.get(url, options).pipe(switchMap((res) => {
      console.log('from service', res)
      return of(res);
    }))
  }

  emailSubscription(userData): Observable<any> {
    let url = `http://${environment.API_GATEWAY_DOMAIN}:3000/api/user/check-email`;
    let headers = new HttpHeaders({
      "Access-Control-Allow-Origin": "*",
      'Content-Type': 'application/json'
    });
    let options = { headers: headers, params: userData };
    return this.http.get(url, options).pipe(switchMap((res: any) => {
      // val = '';
      if (res.message === 'valid') {
        // localStorage.setItem('access_topken', res['x-auth-token'])
        // this.token = res['x-auth-token'];
        return of(res);
      }
      else {
        alert('wrong email');
        return throwError(() => new Error('wrong credentials'));
      }
    }));
  }

  userNameSubscription(userData): Observable<any> {
    let url = `http://${environment.API_GATEWAY_DOMAIN}:3000/api/user/check-username`;
    let headers = new HttpHeaders({
      "Access-Control-Allow-Origin": "*",
      'Content-Type': 'application/json'
    });
    let options = { headers: headers, params: userData };
    return this.http.get(url, options).pipe(switchMap((res: any) => {
      // val = '';
      if (res.message === 'valid') {
        // localStorage.setItem('access_topken', res['x-auth-token'])
        // this.token = res['x-auth-token'];
        return of(res);
      }
      else {
        alert('wrong email');
        return throwError(() => new Error('wrong credentials'));
      }
    }));
  }

  finalSignup(userData): Observable<any> {
    let url = `http://${environment.API_GATEWAY_DOMAIN}:3000/api/user/signup`;
    let headers = new HttpHeaders({
      "Access-Control-Allow-Origin": "*",
      'Content-Type': 'application/json'
    });
    let options = { headers: headers };
    return this.http.post(url, userData, options).pipe(switchMap((res: any) => {
      // val = '';
      if (res.message === 'ok') {
        // localStorage.setItem('access_topken', res['x-auth-token'])
        // this.token = res['x-auth-token'];
        return of(res);
      }
      else {
        alert('wrong email');
        return throwError(() => new Error('wrong credentials'));
      }
    }));
  }

  generateOtp(userData): Observable<any> {
    let url = `http://${environment.API_GATEWAY_DOMAIN}:3000/api/user/create-otp`;
    let headers = new HttpHeaders({
      "Access-Control-Allow-Origin": "*",
      'Content-Type': 'application/json'
    });
    let options = { headers: headers };
    return this.http.post(url, userData, options).pipe(switchMap((res: any) => {
      // val = '';
      if (res.message === 'ok') {
        // localStorage.setItem('access_topken', res['x-auth-token'])
        // this.token = res['x-auth-token'];
        return of(res);
      }
      else {
        alert('wrong email');
        return throwError(() => new Error('wrong credentials'));
      }
    }));
  }

  checkOTP(userData): Observable<any> {
    let url = `http://${environment.API_GATEWAY_DOMAIN}:3000/api/user/check-otp`;
    let headers = new HttpHeaders({
      "Access-Control-Allow-Origin": "*",
      'Content-Type': 'application/json'
    });
    let options = { headers: headers };
    return this.http.post(url, userData, options).pipe(switchMap((res: any) => {
      // val = '';
      if (res.message === 'valid') {
        // localStorage.setItem('access_topken', res['x-auth-token'])
        // this.token = res['x-auth-token'];
        return of(res);
      }
      else {
        alert('wrong email');
        return throwError(() => new Error('wrong credentials'));
      }
    }));
  }

  // ###123123aA
  // ibatj
}
