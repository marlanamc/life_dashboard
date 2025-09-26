/**
 * Projects Table Component
 * Displays a sortable, editable project list in a compact table format
 */
export class ProjectsTable {
  constructor(container, dataManager, taskHub = null) {
    this.container = container;
    this.data = dataManager;
    this.taskHub = taskHub;
    this.projects = this.loadProjects();
    this.sortColumn = 'priority';
    this.sortDirection = 'asc';
    this.filterPriority = 'all';
    this.init();
  }

  init() {
    this.render();
  }

  loadProjects() {
    // Load projects from DataManager, with empty array as default
    const savedProjects = this.data.get('projects', []);

    // If no projects exist, create a sample starter project
    if (savedProjects.length === 0) {
      const starterProject = {
        id: 1,
        name: 'Welcome to Your Project Library',
        priority: 'medium',
        category: 'Teaching',
        todos: 'Click + New to add your first real project',
        repoUrl: '',
        obsidianNote: ''
      };
      this.saveProjects([starterProject]);
      return [starterProject];
    }

    return savedProjects;
  }

  saveProjects(projects = this.projects) {
    this.data.set('projects', projects);
  }

  generateId() {
    return Math.max(0, ...this.projects.map(p => p.id)) + 1;
  }

  addProject(projectData) {
    const newProject = {
      id: this.generateId(),
      name: projectData.name || 'New Project',
      priority: projectData.priority || 'medium',
      category: projectData.category || 'Teaching',
      todos: projectData.todos || '',
      repoUrl: projectData.repoUrl || '',
      obsidianNote: projectData.obsidianNote || ''
    };

    this.projects.push(newProject);
    this.saveProjects();
    this.render();
    return newProject;
  }

  updateProject(id, field, value) {
    const project = this.projects.find(p => p.id === id);
    if (project) {
      project[field] = value;
      this.saveProjects();
      return project;
    }
    return null;
  }

  deleteProject(id) {
    const index = this.projects.findIndex(p => p.id === id);
    if (index !== -1) {
      const deletedProject = this.projects.splice(index, 1)[0];
      this.saveProjects();
      this.render();
      return deletedProject;
    }
    return null;
  }

  getObsidianUrl(noteName) {
    if (!noteName) return '';
    // Obsidian URI scheme: obsidian://open?vault=YourVault&file=NoteName
    // User can customize vault name in settings
    const vaultName = this.data.get('obsidianVault', 'Main');
    return `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(noteName)}`;
  }

  handleCellUpdate(cell) {
    const projectRow = cell.closest('tr');
    const projectId = parseInt(projectRow.dataset.projectId);
    const field = cell.dataset.field;
    const value = cell.textContent.trim();

    if (field && projectId) {
      this.updateProject(projectId, field, value);
    }
  }

  getFilteredProjects() {
    if (this.filterPriority === 'all') {
      return [...this.projects];
    }
    return this.projects.filter(project => project.priority === this.filterPriority);
  }

  getSortedProjects() {
    const sorted = this.getFilteredProjects();
    if (!this.sortColumn) {
      return sorted;
    }

    const direction = this.sortDirection === 'asc' ? 1 : -1;
    const priorityOrder = { high: 0, medium: 1, low: 2 };

    return sorted.sort((a, b) => {
      if (this.sortColumn === 'priority') {
        const aPriority = priorityOrder[a.priority] ?? 3;
        const bPriority = priorityOrder[b.priority] ?? 3;
        if (aPriority === bPriority) {
          return a.name.localeCompare(b.name) * direction;
        }
        return (aPriority - bPriority) * direction;
      }

      let aVal = a[this.sortColumn] ?? '';
      let bVal = b[this.sortColumn] ?? '';

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal === bVal) {
        return 0;
      }

      return aVal > bVal ? direction : -direction;
    });
  }

  render() {
    if (!this.container) return;

    const projects = this.getSortedProjects();

    const rows = projects.map(project => {
      const projectNameCell = project.repoUrl || project.obsidianNote
        ? `<td class="project-name-cell" data-label="Project">
             <div class="project-name-links">
               <span class="project-name" contenteditable="true" data-field="name">${project.name}</span>
               <div class="project-links">
                 ${project.repoUrl ? `<a href="${project.repoUrl}" target="_blank" class="project-link" title="Open GitHub repo">🔗</a>` : ''}
                 ${project.obsidianNote ? `<a href="${this.getObsidianUrl(project.obsidianNote)}" class="obsidian-link" title="Open in Obsidian">📝</a>` : ''}
               </div>
             </div>
           </td>`
        : `<td class="project-name-cell" data-label="Project" contenteditable="true" data-field="name">${project.name}</td>`;

      return `
        <tr data-project-id="${project.id}" style="background: ${this.getCategoryColor(project.category)};">
          <td class="priority-cell" data-label="Priority">
            <button class="priority-btn" data-field="priority" title="${this.getPriorityLabel(project.priority)} priority - click to change">
              ${this.getPriorityEmoji(project.priority)}
            </button>
          </td>
          ${projectNameCell}
          <td contenteditable="true" data-label="Category" data-field="category">${project.category}</td>
          <td contenteditable="true" data-label="Todos" data-field="todos">${project.todos}</td>
          <td class="actions-cell" data-label="Actions">
            ${this.taskHub ? `
              <button class="work-today-btn" data-project-id="${project.id}" data-project-name="${project.name}" title="Add to today's capacity planning">
                ⚡ Work today
              </button>
            ` : ''}
            <button class="delete-project-btn" data-project-id="${project.id}" title="Delete project">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="projects-table-wrapper">
        <div class="projects-table__meta">
          <span>${projects.length} projects</span>
          <div class="projects-table__filters">
            <label class="filter-label" for="priority-filter">Priority</label>
            <select id="priority-filter" class="filter-select" data-filter="priority">
              ${this.getPriorityOptions(this.filterPriority, true)}
            </select>
          </div>
        </div>
        <div class="projects-table__scroll">
          <table class="projects-table__grid">
            <thead>
              <tr>
                ${this.renderHeaderCell('priority', 'Priority')}
                ${this.renderHeaderCell('name', 'Project Name')}
                ${this.renderHeaderCell('category', 'Category')}
                ${this.renderHeaderCell('todos', 'Todos')}
                <th class="projects-table__header-cell actions-header">Actions</th> 
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  renderHeaderCell(column, label) {
    const arrow = this.sortColumn === column ? (this.sortDirection === 'asc' ? '↑' : '↓') : '↕';
    return `
      <th data-column="${column}" class="projects-table__header-cell">
        <button type="button" class="header-sort" data-column="${column}">
          <span>${label}</span>
          <span class="sort-indicator">${arrow}</span>
        </button>
      </th>
    `;
  }

  getPriorityOptions(selected, includeAll = false) {
    const options = includeAll ? [{ value: 'all', label: 'All priorities' }] : [];
    options.push(
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' }
    );

    return options.map(option => `
      <option value="${option.value}" ${option.value === selected ? 'selected' : ''}>${option.label}</option>
    `).join('');
  }

  getPriorityEmoji(priority) {
    switch (priority) {
      case 'high':
        return '🔥'; // Fire for high priority
      case 'medium':
        return '⚡'; // Lightning for medium priority
      case 'low':
        return '🌱'; // Seedling for low priority
      default:
        return '❓';
    }
  }

  getPriorityLabel(priority) {
    switch (priority) {
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return priority;
    }
  }

  cyclePriority(currentPriority) {
    const priorities = ['high', 'medium', 'low'];
    const currentIndex = priorities.indexOf(currentPriority);
    const nextIndex = (currentIndex + 1) % priorities.length;
    return priorities[nextIndex];
  }

  getCategoryColor(category) {
    const categoryColors = {
      'Teaching': 'rgba(99, 179, 237, 0.1)', // Soft blue
      'Coaching': 'rgba(129, 201, 149, 0.1)', // Soft green
      'ADHD Projects': 'rgba(255, 183, 77, 0.1)', // Soft orange
      'Economics': 'rgba(196, 125, 214, 0.1)', // Soft purple
      // Fallbacks for existing sample data
      'Design': 'rgba(99, 179, 237, 0.1)',
      'Consulting': 'rgba(129, 201, 149, 0.1)',
      'Community': 'rgba(255, 183, 77, 0.1)',
      'Content': 'rgba(196, 125, 214, 0.1)',
      'Development': 'rgba(99, 179, 237, 0.1)',
      'Operations': 'rgba(129, 201, 149, 0.1)',
      'Product': 'rgba(255, 183, 77, 0.1)',
      'Systems': 'rgba(196, 125, 214, 0.1)',
      'Personal': 'rgba(99, 179, 237, 0.1)',
      'Habits': 'rgba(129, 201, 149, 0.1)',
      'Audio': 'rgba(255, 183, 77, 0.1)'
    };
    return categoryColors[category] || 'rgba(200, 200, 200, 0.05)';
  }

  attachEventListeners() {
    this.container.querySelectorAll('.header-sort').forEach(button => {
      button.addEventListener('click', (e) => {
        const column = e.currentTarget.getAttribute('data-column');
        this.toggleSort(column);
      });
    });

    this.container.querySelectorAll('[contenteditable="true"]').forEach(cell => {
      cell.addEventListener('blur', (e) => this.handleCellUpdate(e.target));
      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.target.blur();
        }
      });
    });

    this.container.querySelectorAll('.priority-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const projectRow = e.target.closest('tr');
        const projectId = parseInt(projectRow.dataset.projectId);
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
          const newPriority = this.cyclePriority(project.priority);
          this.updateProject(projectId, 'priority', newPriority);
          this.render(); // Re-render to update the emoji
        }
      });
    });

    this.container.querySelectorAll('.filter-select').forEach(select => {
      select.addEventListener('change', (e) => this.applyFilter(e.target));
    });

    this.container.querySelectorAll('.delete-project-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const projectId = parseInt(button.dataset.projectId);
        this.confirmDeleteProject(projectId);
      });
    });

    // Add "Work today" button event listeners
    this.container.querySelectorAll('.work-today-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const projectId = parseInt(button.dataset.projectId);
        const projectName = button.dataset.projectName;
        this.addProjectToTodaysWork(projectId, projectName);
      });
    });

    this.container.closest('.projects-hub')?.querySelector('.add-project-btn')?.addEventListener('click', () => {
      // Delegate to the main app's modal
      window.app?.showNewProjectModal();
    });
  }

  toggleSort(column) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.render();
  }

  updateProject(target) {
    const row = target.closest('tr');
    if (!row) return;

    const projectId = Number(row.getAttribute('data-project-id'));
    const field = target.getAttribute('data-field');
    const project = this.projects.find(p => p.id === projectId);
    if (!project || !field) return;

    if (target.tagName === 'SELECT') {
      project[field] = target.value;
    } else {
      project[field] = target.textContent.trim();
    }

    if (field === 'priority') {
      this.render();
    }
  }

  addNewProject() {
    const nextId = Math.max(...this.projects.map(p => p.id)) + 1;
    this.projects.unshift({
      id: nextId,
      name: 'New project',
      priority: 'medium',
      category: 'General',
      todos: 'Define first action'
    });
    this.render();
  }

  applyFilter(target) {
    const filterType = target.getAttribute('data-filter');
    if (filterType === 'priority') {
      this.filterPriority = target.value;
      this.render();
    }
  }

  confirmDeleteProject(projectId) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return;

    // Create confirmation dialog
    const dialog = document.createElement('div');
    dialog.className = 'delete-confirmation-dialog';
    dialog.innerHTML = `
      <div class="dialog-backdrop"></div>
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>Delete Project</h3>
        </div>
        <div class="dialog-body">
          <p>Are you sure you want to delete <strong>"${project.name}"</strong>?</p>
          <p class="dialog-warning">This action cannot be undone.</p>
        </div>
        <div class="dialog-actions">
          <button class="btn btn--ghost cancel-delete-btn">Cancel</button>
          <button class="btn btn--danger confirm-delete-btn">Delete Project</button>
        </div>
      </div>
    `;

    // Add styles
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    document.body.appendChild(dialog);

    // Add event listeners
    const cancelBtn = dialog.querySelector('.cancel-delete-btn');
    const confirmBtn = dialog.querySelector('.confirm-delete-btn');
    const backdrop = dialog.querySelector('.dialog-backdrop');

    const closeDialog = () => {
      document.body.removeChild(dialog);
    };

    cancelBtn.addEventListener('click', closeDialog);
    backdrop.addEventListener('click', closeDialog);
    
    confirmBtn.addEventListener('click', () => {
      this.deleteProject(projectId);
      closeDialog();
    });

    // Add escape key listener
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeDialog();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  /**
   * Add project work to today's capacity planning
   */
  addProjectToTodaysWork(projectId, projectName) {
    if (!this.taskHub) {
      console.warn('Task hub not available for project integration');
      return;
    }

    // Show work planning modal
    this.showProjectWorkModal(projectId, projectName);
  }

  /**
   * Show modal for planning project work
   */
  showProjectWorkModal(projectId, projectName) {
    const modal = document.createElement('div');
    modal.className = 'project-work-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="project-work-container">
        <div class="project-work-header">
          <h3>Add Project Work to Today</h3>
          <p>Plan work for <strong>${projectName}</strong></p>
          <button class="modal-close" data-action="close">×</button>
        </div>

        <div class="project-work-content">
          <div class="work-input-section">
            <label for="work-description">What will you work on?</label>
            <input type="text" id="work-description" placeholder="e.g., Fix authentication bug, Add testing" class="work-input">

            <label for="estimated-hours">Estimated hours:</label>
            <select id="estimated-hours" class="work-input">
              <option value="0.5">30 minutes</option>
              <option value="1">1 hour</option>
              <option value="1.5">1.5 hours</option>
              <option value="2" selected>2 hours</option>
              <option value="3">3 hours</option>
              <option value="4">4 hours</option>
              <option value="6">6 hours</option>
              <option value="8">Full day</option>
            </select>

            <div class="work-note">
              <p>This will add the work to your capacity planning for today, helping you manage your energy and time.</p>
            </div>
          </div>
        </div>

        <div class="project-work-actions">
          <button class="work-btn work-btn--secondary" data-action="close">Cancel</button>
          <button class="work-btn work-btn--primary" id="add-work-submit">Add to Today</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event handlers
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop') ||
          e.target.dataset.action === 'close') {
        document.body.removeChild(modal);
        return;
      }

      if (e.target.id === 'add-work-submit') {
        this.submitProjectWork(modal, projectId, projectName);
      }
    });

    // Enter key handler
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.id === 'work-description') {
        this.submitProjectWork(modal, projectId, projectName);
      }
    });

    // Focus description input
    setTimeout(() => modal.querySelector('#work-description').focus(), 100);
  }

  /**
   * Submit project work to task hub
   */
  submitProjectWork(modal, projectId, projectName) {
    const description = modal.querySelector('#work-description').value.trim();
    const estimatedHours = parseFloat(modal.querySelector('#estimated-hours').value);

    if (!description) {
      alert('Please describe what you\'ll work on');
      return;
    }

    // Add to task hub
    const projectTask = this.taskHub.pullProjectTaskToDaily(
      projectId,
      projectName,
      description,
      estimatedHours
    );

    // Show success notification
    this.showNotification(`✅ Added "${description}" to today's work (${estimatedHours}h planned)`);

    document.body.removeChild(modal);
  }

  /**
   * Show temporary notification
   */
  showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = 'project-notification';

    // Styling
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'var(--color-primary)',
      color: 'white',
      padding: 'var(--spacing-sm) var(--spacing-lg)',
      borderRadius: 'var(--radius-md)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--font-medium)',
      zIndex: '1000',
      animation: 'slideInRight 0.3s ease-out',
      boxShadow: 'var(--shadow-medium)',
      maxWidth: '300px'
    });

    document.body.appendChild(notification);
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, duration);
  }
}
