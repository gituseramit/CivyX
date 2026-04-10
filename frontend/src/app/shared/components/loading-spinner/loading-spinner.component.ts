import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center gap-3 py-12">
      <div class="relative w-12 h-12">
        <div class="absolute inset-0 rounded-full border-4 border-gray-200"></div>
        <div class="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
      </div>
      @if (label) {
        <p class="text-sm text-gray-500 font-medium">{{ label }}</p>
      }
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class LoadingSpinnerComponent {
  @Input() label = '';
}
