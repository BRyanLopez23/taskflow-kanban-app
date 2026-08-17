/**
 * TaskFlow Pro - Agile Kanban & Project Tracker
 * Arquitectura en JavaScript ES6+ aplicando Programación Orientada a Objetos (POO),
 * persistencia JSON y manipulación reactiva del DOM.
 * Autor: Bryan Francisco López León (github.com/BRyanLopez23)
 */

class TaskItem {
    constructor({ id, title, description, tag, priority = 'MEDIUM', status = 'TODO', createdAt = null }) {
        this.id = id || `TSK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        this.title = title.trim();
        this.description = description.trim();
        this.tag = tag.trim();
        this.priority = priority;
        this.status = status;
        this.createdAt = createdAt || new Date().toISOString().split('T')[0];
    }
}

class KanbanStore {
    constructor(storageKey = 'taskflow_pro_tasks_v1') {
        this.storageKey = storageKey;
        this.tasks = this.loadFromStorage();
    }

    loadFromStorage() {
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) {
            return this.seedInitialTasks();
        }
        try {
            const parsed = JSON.parse(raw);
            return parsed.map(item => new TaskItem(item));
        } catch (err) {
            console.error('Error al parsear JSON en localStorage:', err);
            return this.seedInitialTasks();
        }
    }

    saveToStorage() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
    }

    seedInitialTasks() {
        const initial = [
            new TaskItem({
                id: 'TSK-101',
                title: 'Diseñar endpoints RESTful para autenticación JWT',
                description: 'Implementar rutas /api/auth/login y middleware de validación de sesiones seguras.',
                tag: 'Backend / API',
                priority: 'HIGH',
                status: 'DONE'
            }),
            new TaskItem({
                id: 'TSK-102',
                title: 'Optimizar consultas SQL con índices compuestos',
                description: 'Reducir tiempo de respuesta en reportes analíticos usando JOINs e indexación.',
                tag: 'Database / SQL',
                priority: 'HIGH',
                status: 'IN_PROGRESS'
            }),
            new TaskItem({
                id: 'TSK-103',
                title: 'Construir componentes responsivos en el Dashboard',
                description: 'Adaptar grilla CSS Grid y Flexbox para dispositivos móviles y tablets.',
                tag: 'Frontend / UI',
                priority: 'MEDIUM',
                status: 'IN_PROGRESS'
            }),
            new TaskItem({
                id: 'TSK-104',
                title: 'Escribir pruebas unitarias para capa de servicios POO',
                description: 'Verificar casos borde y validación de payloads JSON.',
                tag: 'QA / Testing',
                priority: 'LOW',
                status: 'TODO'
            })
        ];
        localStorage.setItem(this.storageKey, JSON.stringify(initial));
        return initial;
    }

    addTask(data) {
        const newTask = new TaskItem(data);
        this.tasks.unshift(newTask);
        this.saveToStorage();
        return newTask;
    }

    moveTask(taskId, nextStatus) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = nextStatus;
            this.saveToStorage();
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveToStorage();
    }

    filterTasks(query = '', priority = '') {
        const q = query.trim().toLowerCase();
        return this.tasks.filter(task => {
            const matchesQuery = !q ||
                task.title.toLowerCase().includes(q) ||
                task.description.toLowerCase().includes(q) ||
                task.tag.toLowerCase().includes(q);
            const matchesPriority = !priority || task.priority === priority;
            return matchesQuery && matchesPriority;
        });
    }
}

class KanbanController {
    constructor(store) {
        this.store = store;
        this.searchInput = document.getElementById('searchInput');
        this.filterPriority = document.getElementById('filterPriority');
        this.taskForm = document.getElementById('taskForm');
        this.exportJsonBtn = document.getElementById('exportJsonBtn');

        this.bindEvents();
        this.render();
    }

    bindEvents() {
        this.searchInput.addEventListener('input', () => this.render());
        this.filterPriority.addEventListener('change', () => this.render());

        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('taskTitle').value;
            const description = document.getElementById('taskDesc').value;
            const tag = document.getElementById('taskTag').value;
            const priority = document.getElementById('taskPriority').value;

            this.store.addTask({ title, description, tag, priority });
            this.taskForm.reset();
            this.render();
        });

        this.exportJsonBtn.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.store.tasks, null, 2));
            const a = document.createElement('a');
            a.setAttribute('href', dataStr);
            a.setAttribute('download', 'taskflow_kanban_export.json');
            document.body.appendChild(a);
            a.click();
            a.remove();
        });
    }

    render() {
        const filtered = this.store.filterTasks(this.searchInput.value, this.filterPriority.value);
        const statuses = ['TODO', 'IN_PROGRESS', 'DONE'];

        statuses.forEach(status => {
            const container = document.getElementById(`list-${status}`);
            const countBadge = document.getElementById(`count-${status}`);
            const items = filtered.filter(t => t.status === status);

            countBadge.textContent = items.length;
            container.innerHTML = '';

            items.forEach(task => {
                const card = document.createElement('div');
                card.className = 'task-card';
                card.innerHTML = `
                    <div class="task-top">
                        <span class="priority-badge prio-${task.priority}">${task.priority}</span>
                        <span class="task-tag">#${task.tag}</span>
                    </div>
                    <div class="task-title">${task.title}</div>
                    <div class="task-desc">${task.description}</div>
                    <div class="task-actions">
                        <div style="display:flex;gap:4px;">
                            ${status !== 'TODO' ? `<button class="btn-xs" data-action="move" data-id="${task.id}" data-target="TODO">← Backlog</button>` : ''}
                            ${status !== 'IN_PROGRESS' ? `<button class="btn-xs" data-action="move" data-id="${task.id}" data-target="IN_PROGRESS">⚡ En Progreso</button>` : ''}
                            ${status !== 'DONE' ? `<button class="btn-xs" data-action="move" data-id="${task.id}" data-target="DONE">✓ Completar</button>` : ''}
                        </div>
                        <button class="btn-xs" style="color:#fb7185;" data-action="delete" data-id="${task.id}">✕</button>
                    </div>
                `;
                container.appendChild(card);
            });
        });

        // Delegación de eventos para botones de acción
        document.querySelectorAll('[data-action="move"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.store.moveTask(btn.dataset.id, btn.dataset.target);
                this.render();
            });
        });

        document.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.store.deleteTask(btn.dataset.id);
                this.render();
            });
        });

        // Actualizar métricas
        const all = this.store.tasks;
        const doneCount = all.filter(t => t.status === 'DONE').length;
        const wipCount = all.filter(t => t.status === 'IN_PROGRESS').length;
        const rate = all.length ? Math.round((doneCount / all.length) * 100) : 0;

        document.getElementById('statTotal').textContent = all.length;
        document.getElementById('statProgress').textContent = wipCount;
        document.getElementById('statDone').textContent = doneCount;
        document.getElementById('statRate').textContent = `${rate}%`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const store = new KanbanStore();
    new KanbanController(store);
});
