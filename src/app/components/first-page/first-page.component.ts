import { Component, OnInit } from '@angular/core';
import { Task, TaskService } from '../service/task.service';
import * as ExcelJS from 'exceljs';
import * as FileSaver from 'file-saver';

@Component({
    selector: 'app-first-page',
    templateUrl: './first-page.component.html',
    styleUrls: ['./first-page.component.scss']
})
export class FirstPageComponent implements OnInit {
    tasks: Task[] = []
    searchTerm: string = '';
    selectedTag: string = '';
    deadlineFilter: string = 'all'; // passed, available, all
    checkedCount: number = 0;
    isAnyChecked: boolean = false;
    checkboxAll: boolean = false;

    constructor(private taskService: TaskService) { }

    ngOnInit() {
        this.refresh();
    }

    get filteredTasks() {
        return this.tasks.filter(task => {
            const matchesSearch = task.name.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchesTag = this.selectedTag ? task.tag === this.selectedTag : true;
            const matchesDeadline = this.deadlineFilter === 'all' ||
                (this.deadlineFilter === 'passed' && new Date(task.deadline) < new Date()) ||
                (this.deadlineFilter === 'available' && new Date(task.deadline) >= new Date());
            return matchesSearch && matchesTag && matchesDeadline;
        });
    }

    deleteTask(id: number) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.taskService.deleteTask(id);
            this.refresh(); // Refresh task list
        }
    }

    deleteMultiple() {
        const tag = this.tasks.filter(task => task.isChecked);
        const idList = tag.map(e => e.id);
        if (confirm('Are you sure you want to delete these tasks?')) {
            this.taskService.deleteMultiple(idList);
            this.refresh();
        }
    }

    isDeadlinePassed(deadline: string): boolean {
        return new Date(deadline) < new Date();
    }

    toggleCheck(id: number) {
        const tag = this.tasks.find(item => item.id === id);
        tag.isChecked = !tag.isChecked;
        this.updateCheckedCount();
        // console.log('Ticked: ', tag.isChecked, ', Completed', tag.isDone);
    }

    checkAll() {
        this.tasks.forEach(task => task.isChecked = this.checkboxAll);
        this.updateCheckedCount();
    }

    updateCheckedCount() {
        this.checkedCount = this.tasks.filter(task => task.isChecked).length;
        this.isAnyChecked = this.checkedCount > 0;
        // console.log(this.checkedCount);
    }

    toggleText(id: number) {
        const tag = this.tasks.find(item => item.id === id);
        tag.isDone = !tag.isDone; // Toggle the boolean value
        this.taskService.updateTask(tag);
    }

    markAsCompleted() {
        this.tasks.forEach(task => {
            if (task.isChecked) {
                task.isDone = true; // Update status to "completed"
                task.isChecked = false; // Optionally uncheck the checkbox
            }
            this.taskService.saveTask(task);
            // console.log(task.isChecked);
        });
        this.updateCheckedCount();
        this.refresh();
    }

    markAsIncomplete() {
        this.tasks.forEach(task => {
            if (task.isChecked) {
                task.isDone = false; // Update status to "incomplete"
                task.isChecked = false; // Optionally uncheck the checkbox
            }
            this.taskService.saveTask(task);
            // console.log(task.isChecked);
        });
        this.updateCheckedCount();
        this.refresh();
    }

    refresh() {
        const storedTasks = localStorage.getItem('myTodoList');
        if (storedTasks) {
            this.tasks = JSON.parse(storedTasks);
            this.tasks.forEach(task => {
                task.isChecked = false; // Reset checkbox state
            });
            this.checkboxAll = false;
        }
    }

    exportToExcel() {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('myTodoList');

        // Add column headers
        worksheet.columns = [
            { header: 'Task Name', key: 'name', width: 30 },
            { header: 'Deadline', key: 'deadline', width: 20 },
            { header: 'Tag', key: 'tag', width: 15 },
            { header: 'Status', key: 'status', width: 20 },
        ];

        // Add rows
        this.tasks.filter(task => task.isChecked)
            .forEach(task => {
                worksheet.addRow({
                    name: task.name,
                    deadline: task.deadline,
                    tag: task.tag,
                    status: task.isDone ? 'Completed' : 'Due to finish',
                });
            });

        // Prepare to save the file
        workbook.xlsx.writeBuffer().then((buffer) => {
            const blob = new Blob([buffer], { type: 'application/octet-stream' });
            FileSaver.saveAs(blob, 'myTodoList.xlsx'); // Save file with name 'tasks.xlsx'
        });
    }

    addFile(event: any) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const data = new Uint8Array(e.target.result as ArrayBuffer);
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(data);

                const worksheet = workbook.worksheets[0]; // Get the first worksheet
                const newTasks: Task[] = []; // Temporary array for new tasks

                // Read rows from the worksheet
                worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
                    if (rowNumber > 1) { // Skip header row
                        const task: Task = {
                            id: this.generateUniqueId(), // Generate a unique ID
                            name: row.getCell(1).value as string,
                            deadline: row.getCell(2).value as string,
                            tag: row.getCell(3).value as string,
                        };
                        newTasks.push(task); // Add to temporary tasks array
                    }
                });

                // Merge new tasks into existing tasks
                this.tasks = [...this.tasks, ...newTasks];

                this.updateFile(); // Update localStorage with new tasks
                this.updateCheckedCount(); // Refresh checked count
                this.refresh();
            };
            reader.readAsArrayBuffer(file); // Read the file as an ArrayBuffer
        }
        setTimeout(() => {
            event.target.value = null;
        });
    }

    updateFile() {
        localStorage.setItem('myTodoList', JSON.stringify(this.tasks)); // Save tasks to localStorage
    }

    generateUniqueId(): number {
        return Date.now() + Math.floor(Math.random() * 1000); // Simple unique ID generator
    }
}
