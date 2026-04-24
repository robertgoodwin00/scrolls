import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from './environments/environment';

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Magician Scrolls';

  constructor(private http: HttpClient) {}

  // this is for CSRF protection
  ngOnInit() {
    this.http.get(`${environment.apiUrl}/api/csrf-token`, { withCredentials: true })
      .subscribe({
        next: () => console.log('CSRF token initialized'),
        error: (err) => console.error('Failed to fetch CSRF token', err),
      });
  }
}


