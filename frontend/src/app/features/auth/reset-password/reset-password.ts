import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
  private formBuilder=inject(FormBuilder);
  private auth=inject(AuthService);
  private router=inject(Router);

  form:FormGroup;
  loading=signal(false);
  errorMessage=signal('');
  successMessage=signal('');

  passwordMatchingValidator(control:AbstractControl):ValidationErrors |null{
    const password=control.get('password')?.value;
    const confirmPassword=control.get('confirmPassword')?.value;
    
    return password===confirmPassword ?null: {
      mismatch:true
    };
  }

  constructor(){
    this.form=this.formBuilder.group({
      password:['',[Validators.required,Validators.minLength(6)]],
      confirmPassword:['',Validators.required]
    },{
      validators:this.passwordMatchingValidator
    });
  }

  async onSubmit():Promise<void>{
    if(this.form.invalid){
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');


    try{
      await this.auth.updatePassword(this.form.value.password);

        this.successMessage.set('Password updated successfully! Redirecting...');
      setTimeout(()=> {
        this.router.navigate(['/dashboard']);
      },2000);
    }catch(err:any){
      this.errorMessage.set(err.message ?? 'Failed to reset password. Try again')
    }finally{
      this.loading.set(false);
    }
  }

}