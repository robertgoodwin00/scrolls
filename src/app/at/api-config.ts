import { environment } from "../environments/environment";

// api-config.ts
export interface ApiConfig {
  url: string;
  headers: Record<string, string>;
  model: string;
  bodyFormatter: (messages: any[]) => any; 
  responseParser: (response: any) => string;
}


/*
export const API_CONFIGS: Record<number, ApiConfig> = {
  // for general use
  1: {
    // OpenRouter Mistral Nemo
    url: 'https://openrouter.ai/api/v1/chat/completions',
    headers: {
      'Authorization': 'Bearer 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',
      'Content-Type': 'application/json'
    },
    model: 'mistralai/mistral-nemo',
    bodyFormatter: (messages: any[]) => ({
      model: 'mistralai/mistral-nemo',
      messages: messages
      //{ role: 'assistant', content: "You live in a condo in Maine." }
      
    }),
    responseParser: (response: any) => response?.choices[0].message.content || 'Sorry, I didn’t understand that.'
  },

 // for summarization
 2: {
    // OpenRouter meta-llama/llama-3.3-8b-instruct:free
    url: 'https://openrouter.ai/api/v1/chat/completions',
    headers: {
      'Authorization': 'Bearer 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',
      'Content-Type': 'application/json'
    },
    model: 'meta-llama/llama-3.3-8b-instruct:free', 
    bodyFormatter: (messages: any[]) => ({
      model: 'meta-llama/llama-3.3-8b-instruct:free',
      messages: messages
    }),
    responseParser: (response: any) => response?.choices[0].message.content || 'Sorry, I didn’t understand that.'
  },

  

};

*/


export const API_CONFIGS: Record<number, ApiConfig> = {
  1: {
    url: `${environment.apiBaseUrl}/api/or/at`,
    headers: { 'Content-Type': 'application/json' },
    model: 'mistralai/mistral-nemo',
    bodyFormatter: (messages: any[]) => ({
      model: 'mistralai/mistral-nemo',
      messages: messages
    }),
    responseParser: (response: any) =>
      response?.choices[0].message.content || 'Sorry, I didn’t understand that.'
  },

  2: {
    url: `${environment.apiBaseUrl}/api/or/at`,
    headers: { 'Content-Type': 'application/json' },
    model: 'meta-llama/llama-3.3-8b-instruct:free',
    bodyFormatter: (messages: any[]) => ({
      model: 'meta-llama/llama-3.3-8b-instruct:free',
      messages: messages
    }),
    responseParser: (response: any) =>
      response?.choices[0].message.content || 'Sorry, I didn’t understand that.'
  },
};







