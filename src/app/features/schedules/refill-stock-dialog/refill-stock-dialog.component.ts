import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface RefillStockDialogData {
  medicationName: string;
  stockUnit: 'tabletki' | 'ml' | null;
}

@Component({
  selector: 'app-refill-stock-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  templateUrl: './refill-stock-dialog.component.html',
  styles: `
    .full-width {
      width: 100%;
    }
  `,
})
export class RefillStockDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RefillStockDialogComponent>);
  readonly data = inject<RefillStockDialogData>(MAT_DIALOG_DATA);

  readonly amountControl = this.fb.control(1, {
    nonNullable: true,
    validators: [Validators.required, Validators.min(1)],
  });

  confirm(): void {
    if (this.amountControl.invalid) {
      this.amountControl.markAsTouched();
      return;
    }
    this.dialogRef.close(this.amountControl.value);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
