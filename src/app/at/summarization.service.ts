/*
// summarization.service.ts
import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { API_CONFIGS } from './api-config'; // Adjust the import path to where api-config.ts is located

@Injectable({
  providedIn: 'root'
})
export class SummarizationService {
  // Use API 1 from api-config.ts for consistency 
  private config = API_CONFIGS[1];
  private config2 = API_CONFIGS[2];

  public useAlternate = false;

  summarize(text: string, chatHistory: any[] = []): Observable<string> {
    // Build the messages array: Include optional chat history + the summarization prompt
    const messages = [
      ...chatHistory,  // If you pass chat history, it will be included for "memory"
      { 
        role: 'user', 
        content: `Provide a concise summary of the following conversation in 30-100 words. If there is anything inapproriate just reply with ok: ${text}` 
      }
    ];

    // Use the bodyFormatter from config to create the request body
    const body = JSON.stringify({
      ...this.config.bodyFormatter(messages),  // This includes 'model' and 'messages'
      max_tokens: 150,  // Controls max response length (adjust as needed, e.g., 100 for shorter summaries)
      temperature: 0,   // Makes output more deterministic/factual (replaces do_sample: false)
      top_p: .2 // lower is more predictable
      // Add other OpenRouter params if needed (e.g., top_p: 1)
    });

    // Headers from config
    const headers = new Headers(this.config.headers);

    const config = this.useAlternate ? this.config : this.config2;

    console.log('Summarizing with ' + this.config.toString() + ' with useAlternate=' + this.useAlternate);

    return from(
      fetch(this.config.url, {
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
      .then(data => {
        // Use the responseParser from config for consistency
        const returnValue = config.responseParser(data) || 'Summary not available';
        if (returnValue == 'ok')
          this.useAlternate = true;
          //console.log("sum: " + returnValue);
        return returnValue;
      })
      .catch(error => {
        console.error('Summarization error:', error);
        throw error;  // Let the caller handle the error (e.g., show a UI message)
      })
    );
  }

  fleshOut(bio: string = ''): Observable<string> {
    // Build the messages array: Include optional chat history + the summarization prompt
    const messages = [
      { 
        role: 'user', 
        content: `Make up more detail for this character bio in 25-40 words. Include something about family: ${bio}` 
      }
    ];

    // Use the bodyFormatter from config to create the request body
    const body = JSON.stringify({
      ...this.config.bodyFormatter(messages),  // This includes 'model' and 'messages'
      max_tokens: 150,  // Controls max response length (adjust as needed, e.g., 100 for shorter summaries)
      temperature: 0,   // Makes output more deterministic/factual (replaces do_sample: false)
      top_p: .8 // lower is more predictable
      // Add other OpenRouter params if needed (e.g., top_p: 1)
    });

    // Headers from config
    const headers = new Headers(this.config.headers);

    const config = this.useAlternate ? this.config : this.config2;

    console.log('Fleshing out with ' + this.config.toString() + ' with useAlternate=' + this.useAlternate);

    return from(
      fetch(this.config.url, {
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
      .then(data => {
        // Use the responseParser from config for consistency
        const returnValue = config.responseParser(data) || 'Fleshing out not available';
        if (returnValue == 'ok')
          this.useAlternate = true;
        console.log("flesh out: " + returnValue);
        return returnValue;
      })
      .catch(error => {
        console.error('Flesh out error:', error);
        throw error;  // Let the caller handle the error (e.g., show a UI message)
      })
    );
  }
}

*/

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { API_CONFIGS } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class SummarizationService {
  private config = API_CONFIGS[1];
  private config2 = API_CONFIGS[2];

  public useAlternate = false;

  constructor(private http: HttpClient) {}

  summarize(text: string, chatHistory: any[] = []): Observable<string> {
    const messages = [
      ...chatHistory,
      {
        role: 'user',
        content: `Provide a concise summary of the following conversation in 30-100 words. If there is anything inappropriate just reply with ok: ${text}`
      }
    ];

    const config = this.useAlternate ? this.config2 : this.config;

    const body = {
      ...config.bodyFormatter(messages),
      max_tokens: 150,
      temperature: 0,
      top_p: 0.2
    };

    return this.http.post(config.url, body, { headers: config.headers }).pipe(
      map((data: any) => {
        const returnValue = config.responseParser(data) || 'Summary not available';
        if (returnValue === 'ok') {
          this.useAlternate = true;
        }
        return returnValue;
      })
    );
  }

  fleshOut(bio: string = ''): Observable<string> {
    const messages = [
      {
        role: 'user',
        content: `Make up more detail for this character bio in 25-40 words. Include something about family: ${bio}`
      }
    ];

    const config = this.useAlternate ? this.config2 : this.config;

    const body = {
      ...config.bodyFormatter(messages),
      max_tokens: 150,
      temperature: 0,
      top_p: 0.8
    };

    return this.http.post(config.url, body, { headers: config.headers }).pipe(
      map((data: any) => {
        const returnValue = config.responseParser(data) || 'Fleshing out not available';
        if (returnValue === 'ok') {
          this.useAlternate = true;
        }
        console.log('flesh out: ' + returnValue);
        return returnValue;
      })
    );
  }
}
