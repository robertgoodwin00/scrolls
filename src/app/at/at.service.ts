/*
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { API_CONFIGS, ApiConfig } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class atService {
 
  private selectedApi: number = 1; // Default to API 1, can be changed dynamically


  constructor(private http: HttpClient) {}

  // Method to change the API
  setApi(apiNumber: number) {
    if (API_CONFIGS[apiNumber]) {
      this.selectedApi = apiNumber;
      console.log('set api to ' + apiNumber);
    } else {
      console.warn(`API configuration for ${apiNumber} not found`);
    }
  }

  sendMessage(messages: any[]): Observable<any> {
    const config: ApiConfig = API_CONFIGS[this.selectedApi];
    
    const headers = new Headers(config.headers);
    const body = JSON.stringify(config.bodyFormatter(messages));

    return from(
      fetch(config.url, {
        method: 'POST',
        headers: headers,
        body: body
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .catch(error => {
        console.error('Fetch error:', error);
        throw error;
      })
    );
  }

  sendMessageWithConfig(messages: any[], config: ApiConfig): Observable<any> {
    const headers = new Headers(config.headers);
    //const body = JSON.stringify(config.bodyFormatter(messages));

    const body = JSON.stringify({
      ...config.bodyFormatter(messages),  // This includes 'model' and 'messages'
      temperature: .8,   // Makes output more deterministic/factual (replaces do_sample: false)
      //top_p: .2 // lower is more predictable
      // Add other OpenRouter params if needed (e.g., top_p: 1)
    });

    console.log('send with config of ' + config.model);

    return from(
      fetch(config.url, {
        method: 'POST',
        headers: headers,
        body: body
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .catch(error => {
        console.error('Fetch error:', error);
        throw error;
      })
    );
  }

  // Helper method to get response parser for the current API
  getResponseParser(): (response: any) => string {
    return API_CONFIGS[this.selectedApi].responseParser;
  }
  
}

*/

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIGS, ApiConfig } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class atService {
  private selectedApi: number = 1; // Default API

  constructor(private http: HttpClient) {}

  setApi(apiNumber: number) {
    if (API_CONFIGS[apiNumber]) {
      this.selectedApi = apiNumber;
      console.log('Set API to ' + apiNumber);
    } else {
      console.warn(`API configuration for ${apiNumber} not found`);
    }
  }

  sendMessage(messages: any[]): Observable<any> {
    const config: ApiConfig = API_CONFIGS[this.selectedApi];

    const body = config.bodyFormatter(messages);

    return this.http.post(config.url, body, {
      headers: config.headers
    });
  }

  sendMessageWithConfig(messages: any[], config: ApiConfig): Observable<any> {
    const body = {
      ...config.bodyFormatter(messages),
      temperature: 0.8
    };

    console.log('send with config of ' + config.model);

    return this.http.post(config.url, body, {
      headers: config.headers
    });
  }

  getResponseParser(): (response: any) => string {
    return API_CONFIGS[this.selectedApi].responseParser;
  }
}
