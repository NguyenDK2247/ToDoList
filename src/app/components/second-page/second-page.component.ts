import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskService, Task } from '../service/task.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-second-page',
  templateUrl: './second-page.component.html',
  styleUrls: ['./second-page.component.scss']
})
export class SecondPageComponent implements OnInit {
  task: Task = { id: 0, name: '', description: '', deadline: '', tag: '', isDone: false, isChecked: false };
  errorMessage: string = '';
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    public router: Router,
    private route: ActivatedRoute) {
      this.InitFormGroup();
    }
    

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id');
    if (id) {
      const tasks = this.taskService.getTasks();
      this.task = tasks.find(t => t.id === id) || this.task;
      this.form.patchValue(this.task);
    }
  }

  saveTask(form: any) {
    if (this.form.invalid) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }
    this.task = this.form.getRawValue();
    this.taskService.saveTask(this.task);
    this.router.navigate(['/']);
  }

  InitFormGroup() {
    this.form = this.fb.group({
      id: [0],
      name: ['', Validators.compose([Validators.required, Validators.maxLength(50)])],
      description: ['', Validators.compose([Validators.maxLength(200)])],
      deadline: ['', Validators.compose([Validators.required])],
      tag: ['', Validators.compose([Validators.required])],
      isDone: [false]
    });
  }

  isFieldInvalid(field: string): boolean {
    return this.form.get(field).errors && this.form.get(field).touched;
  }
}
