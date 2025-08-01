import { Injectable } from '@angular/core';

export interface Task {
  id: number;
  name: string;
  description?: string;
  deadline: string; // ISO date string
  tag: string;
  isDone?: boolean;
  isChecked?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private storageKey = 'myTodoList';

  getTasks(): Task[] {
    const tasks = localStorage.getItem(this.storageKey);
    return tasks ? JSON.parse(tasks) : [];
  }

  saveTask(task: Task): void {
    const tasks = this.getTasks();
    const existingTaskIndex = tasks.findIndex(t => t.id === task.id);

    if (existingTaskIndex !== -1) {
      tasks[existingTaskIndex] = task; // Update existing task
    } else {
      task.id = this.generateUniqueId(); // Assign unique ID
      tasks.push(task); // Add new task
    }

    localStorage.setItem(this.storageKey, JSON.stringify(tasks));
  }
  
  updateTask(task: Task): void {
    this.saveTask(task);
  }

  deleteTask(id: number): void {
    const tasks = this.getTasks().filter(task => task.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(tasks));
  }

  deleteMultiple(id: number[]) {
    const tasks = this.getTasks().filter(task => !id.includes(task.id));
    localStorage.setItem(this.storageKey, JSON.stringify(tasks));
  }

  private generateUniqueId(): number {
    return Date.now() + Math.floor(Math.random() * 1000); // Simple unique ID generator
  }
}