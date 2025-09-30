/**
 * Projects Table Component
 * Displays a sortable, editable project list in a compact table format
 */
export class ProjectsTable {
  constructor(container, dataManager, taskHub = null) {
    this.container = container;
    this.data = dataManager;
    this.taskHub = taskHub;
    this.unsubscribe = null;
    this.subscribeToData();
    this.projects = this.loadProjects();
    this.sortColumn = 'priority';
    this.sortDirection = 'asc';
    this.filterPriority = 'all';
    this.init();
  }

  init() {
    this.render();
  }

  subscribeToData() {
    if (!this.data || !this.data.subscribe) {
      return;
    }

    this.unsubscribe = this.data.subscribe('projects', (newProjects) => {
      this.projects = Array.isArray(newProjects) ? [...newProjects] : [];
      this.render();
    });
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
        obsidianNote: '',
        // New link fields
        githubUrl: '',
        websiteUrl: '',
        databaseUrl: '',
        hostingUrl: '',
      };
      this.saveProjects([starterProject]);
      return [starterProject];
    }

    // Ensure all projects have the new fields (migration)
    const migratedProjects = savedProjects.map(project => ({
      ...project,
      githubUrl: project.githubUrl || '',
      websiteUrl: project.websiteUrl || '',
      databaseUrl: project.databaseUrl || '',
      hostingUrl: project.hostingUrl || '',
    }));

    return Array.isArray(migratedProjects) ? migratedProjects.map((project) => ({ ...project })) : [];
  }

  saveProjects(projects = this.projects) {
    this.data.set('projects', projects);
  }

  generateId() {
    return Math.max(0, ...this.projects.map((p) => p.id)) + 1;
  }

  addProject(projectData) {
    const newProject = {
      id: this.generateId(),
      name: projectData.name || 'New Project',
      priority: projectData.priority || 'medium',
      category: projectData.category || 'Teaching',
      todos: projectData.todos || '',
      repoUrl: projectData.repoUrl || '',
      obsidianNote: projectData.obsidianNote || '',
      // New link fields
      githubUrl: projectData.githubUrl || '',
      websiteUrl: projectData.websiteUrl || '',
      databaseUrl: projectData.databaseUrl || '',
      hostingUrl: projectData.hostingUrl || '',
    };

    this.projects.push(newProject);
    this.saveProjects();
    this.render();
    return newProject;
  }

  updateProject(id, field, value) {
    const project = this.projects.find((p) => p.id === id);
    if (project) {
      project[field] = value;
      this.saveProjects();
      return project;
    }
    return null;
  }

  deleteProject(id) {
    const index = this.projects.findIndex((p) => p.id === id);
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
    return this.projects.filter((project) => project.priority === this.filterPriority);
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

    const rows = projects
      .map((project) => {
        // Build project links icons
        const projectLinks = [];
        
        if (project.githubUrl) {
          projectLinks.push(`<a href="${project.githubUrl}" target="_blank" class="project-link github-link" title="GitHub Repository">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>`);
        }
        
        if (project.websiteUrl) {
          projectLinks.push(`<a href="${project.websiteUrl}" target="_blank" class="project-link website-link" title="Live Website">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="m1.05 9 2.3-2.3a3.5 3.5 0 0 1 4.95 0l1.4 1.4a3.5 3.5 0 0 1 0 4.95L7.4 15.7a3.5 3.5 0 0 1-4.95 0L1.05 14.3"></path>
            </svg>
          </a>`);
        }
        
        if (project.databaseUrl) {
          projectLinks.push(`<a href="${project.databaseUrl}" target="_blank" class="project-link database-link" title="Database">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
              <path d="m3 5v14a9 3 0 0 0 18 0V5"></path>
              <path d="m3 12a9 3 0 0 0 18 0"></path>
            </svg>
          </a>`);
        }
        
        if (project.hostingUrl) {
          projectLinks.push(`<a href="${project.hostingUrl}" target="_blank" class="project-link hosting-link" title="Hosting Dashboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </a>`);
        }

        // Legacy repo URL (show as Git icon for backwards compatibility)
        if (project.repoUrl && !project.githubUrl) {
          projectLinks.push(`<a href="${project.repoUrl}" target="_blank" class="project-link repo-link" title="Repository">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
          </a>`);
        }
        
        if (project.obsidianNote) {
          projectLinks.push(`<a href="${this.getObsidianUrl(project.obsidianNote)}" class="project-link obsidian-link" title="Open in Obsidian">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.86 2.08L8.53 5.93c-.31.28-.36.75-.13 1.1l.01.01.01.01L10.07 9.3l.42.62c.05.07.1.15.14.23l.08.16.07.15.05.13.04.1.03.08.02.07.01.05.01.04v.02l-.01.06-.02.12-.03.15-.05.18-.07.21-.09.22-.12.23-.14.23-.16.23-.19.22-.21.2-.23.19-.25.16-.26.14-.28.11-.29.08-.31.05-.16.01h-.17l-.17-.01-.17-.02-.17-.04-.16-.05-.16-.06-.16-.08-.15-.09-.15-.11-.14-.12-.13-.14-.12-.15-.1-.16-.09-.17-.08-.18-.06-.19-.05-.19-.03-.2-.02-.2v-.2l.01-.2.03-.2.04-.19.06-.19.07-.18.09-.17.1-.16.12-.15.13-.14.14-.12.15-.11.16-.09.16-.08.16-.06.16-.05.17-.04.17-.02.17-.01h.17l.16.01.31.05.29.08.28.11.26.14.25.16.23.19.21.2.19.22.16.23.14.23.12.23.09.22.07.21.05.18.03.15.02.12.01.06v.05l-.01.05-.02.07-.03.08-.04.1-.05.13-.07.15-.08.16-.14.23-.42.62-1.65 2.25-.01.01-.01.01c-.23.35-.18.82.13 1.1l4.33 3.85a.75.75 0 0 0 1-.04l9.4-8.6c.32-.29.32-.8 0-1.1L13.86 2.08a.75.75 0 0 0-1 0z"/>
            </svg>
          </a>`);
        }

        // Links column - display individual link icons, or placeholder if no links
        const linksColumn = projectLinks.length > 0 
          ? `<td class="links-cell" data-label="Links">
               <div class="project-links-grid">
                 ${projectLinks.join('')}
               </div>
             </td>`
          : `<td class="links-cell" data-label="Links">
               <div class="no-links">
                 <span class="no-links-text">—</span>
               </div>
             </td>`;

        return `
        <tr data-project-id="${project.id}" style="background: ${this.getCategoryColor(project.category)};">
          <td class="priority-cell" data-label="Priority">
            <button class="priority-btn" data-field="priority" title="${this.getPriorityLabel(project.priority)} priority - click to change">
              ${this.getPriorityEmoji(project.priority)}
            </button>
          </td>
          <td class="project-name-cell" data-label="Project" contenteditable="true" data-field="name">${project.name}</td>
          <td contenteditable="true" data-label="Category" data-field="category">${project.category}</td>
          ${linksColumn}
          <td contenteditable="true" data-label="Todos" data-field="todos">${project.todos}</td>
          <td class="actions-cell" data-label="Actions">
            ${
              this.taskHub
                ? `
              <button class="work-today-btn" data-project-id="${project.id}" data-project-name="${project.name}" title="Add to today's capacity planning">
                ⚡ Work today
              </button>
            `
                : ''
            }
            <button class="edit-links-btn" data-project-id="${project.id}" title="Edit project links">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </button>
            <button class="delete-project-btn" data-project-id="${project.id}" title="Delete project">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </td>
        </tr>
      `;
      })
      .join('');

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
                <th class="projects-table__header-cell links-header">Links</th>
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

    return options
      .map(
        (option) => `
      <option value="${option.value}" ${option.value === selected ? 'selected' : ''}>${option.label}</option>
    `
      )
      .join('');
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
      Teaching: 'rgba(99, 179, 237, 0.1)', // Soft blue
      Coaching: 'rgba(129, 201, 149, 0.1)', // Soft green
      'ADHD Projects': 'rgba(255, 183, 77, 0.1)', // Soft orange
      Economics: 'rgba(196, 125, 214, 0.1)', // Soft purple
      // Fallbacks for existing sample data
      Design: 'rgba(99, 179, 237, 0.1)',
      Consulting: 'rgba(129, 201, 149, 0.1)',
      Community: 'rgba(255, 183, 77, 0.1)',
      Content: 'rgba(196, 125, 214, 0.1)',
      Development: 'rgba(99, 179, 237, 0.1)',
      Operations: 'rgba(129, 201, 149, 0.1)',
      Product: 'rgba(255, 183, 77, 0.1)',
      Systems: 'rgba(196, 125, 214, 0.1)',
      Personal: 'rgba(99, 179, 237, 0.1)',
      Habits: 'rgba(129, 201, 149, 0.1)',
      Audio: 'rgba(255, 183, 77, 0.1)',
    };
    return categoryColors[category] || 'rgba(200, 200, 200, 0.05)';
  }

  attachEventListeners() {
    this.container.querySelectorAll('.header-sort').forEach((button) => {
      button.addEventListener('click', (e) => {
        const column = e.currentTarget.getAttribute('data-column');
        this.toggleSort(column);
      });
    });

    this.container.querySelectorAll('[contenteditable="true"]').forEach((cell) => {
      cell.addEventListener('blur', (e) => this.handleCellUpdate(e.target));
      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.target.blur();
        }
      });
    });

    this.container.querySelectorAll('.priority-btn').forEach((button) => {
      button.addEventListener('click', (e) => {
        const projectRow = e.target.closest('tr');
        const projectId = parseInt(projectRow.dataset.projectId);
        const project = this.projects.find((p) => p.id === projectId);
        if (project) {
          const newPriority = this.cyclePriority(project.priority);
          this.updateProject(projectId, 'priority', newPriority);
          this.render(); // Re-render to update the emoji
        }
      });
    });

    this.container.querySelectorAll('.filter-select').forEach((select) => {
      select.addEventListener('change', (e) => this.applyFilter(e.target));
    });

    this.container.querySelectorAll('.delete-project-btn').forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const projectId = parseInt(button.dataset.projectId);
        this.confirmDeleteProject(projectId);
      });
    });

    // Add "Work today" button event listeners
    this.container.querySelectorAll('.work-today-btn').forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const projectId = parseInt(button.dataset.projectId);
        const projectName = button.dataset.projectName;
        this.addProjectToTodaysWork(projectId, projectName);
      });
    });

    // Add "Edit links" button event listeners
    this.container.querySelectorAll('.edit-links-btn').forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const projectId = parseInt(button.dataset.projectId);
        this.showEditLinksModal(projectId);
      });
    });

    // Add project button handler removed - handled in main dashboard
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

  updateProjectFromElement(target) {
    const row = target.closest('tr');
    if (!row) return;

    const projectId = Number(row.getAttribute('data-project-id'));
    const field = target.getAttribute('data-field');
    const project = this.projects.find((p) => p.id === projectId);
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
    const nextId = Math.max(...this.projects.map((p) => p.id)) + 1;
    this.projects.unshift({
      id: nextId,
      name: 'New project',
      priority: 'medium',
      category: 'General',
      todos: 'Define first action',
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
    const project = this.projects.find((p) => p.id === projectId);
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
      if (e.target.classList.contains('modal-backdrop') || e.target.dataset.action === 'close') {
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
   * Show modal for editing project links
   */
  showEditLinksModal(projectId) {
    const project = this.projects.find((p) => p.id === projectId);
    if (!project) return;

    const modal = document.createElement('div');
    modal.className = 'project-links-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="project-links-container">
        <div class="project-links-header">
          <h3>Edit Project Links</h3>
          <p>Add links for <strong>${project.name}</strong></p>
          <button class="modal-close" data-action="close">×</button>
        </div>

        <div class="project-links-content">
          <div class="links-input-section">
            <div class="link-field">
              <label for="github-url">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub Repository
              </label>
              <input type="url" id="github-url" placeholder="https://github.com/username/repo" value="${project.githubUrl || ''}" class="link-input">
            </div>

            <div class="link-field">
              <label for="website-url">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="m1.05 9 2.3-2.3a3.5 3.5 0 0 1 4.95 0l1.4 1.4a3.5 3.5 0 0 1 0 4.95L7.4 15.7a3.5 3.5 0 0 1-4.95 0L1.05 14.3"></path>
                </svg>
                Live Website
              </label>
              <input type="url" id="website-url" placeholder="https://yourproject.com" value="${project.websiteUrl || ''}" class="link-input">
            </div>

            <div class="link-field">
              <label for="database-url">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                  <path d="m3 5v14a9 3 0 0 0 18 0V5"></path>
                  <path d="m3 12a9 3 0 0 0 18 0"></path>
                </svg>
                Database Dashboard
              </label>
              <input type="url" id="database-url" placeholder="https://database-dashboard.com" value="${project.databaseUrl || ''}" class="link-input">
            </div>

            <div class="link-field">
              <label for="hosting-url">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                Hosting Dashboard
              </label>
              <input type="url" id="hosting-url" placeholder="https://vercel.com/dashboard or https://console.firebase.google.com" value="${project.hostingUrl || ''}" class="link-input">
            </div>

            <div class="link-field">
              <label for="obsidian-note">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.86 2.08L8.53 5.93c-.31.28-.36.75-.13 1.1l.01.01.01.01L10.07 9.3l.42.62c.05.07.1.15.14.23l.08.16.07.15.05.13.04.1.03.08.02.07.01.05.01.04v.02l-.01.06-.02.12-.03.15-.05.18-.07.21-.09.22-.12.23-.14.23-.16.23-.19.22-.21.2-.23.19-.25.16-.26.14-.28.11-.29.08-.31.05-.16.01h-.17l-.17-.01-.17-.02-.17-.04-.16-.05-.16-.06-.16-.08-.15-.09-.15-.11-.14-.12-.13-.14-.12-.15-.1-.16-.09-.17-.08-.18-.06-.19-.05-.19-.03-.2-.02-.2v-.2l.01-.2.03-.2.04-.19.06-.19.07-.18.09-.17.1-.16.12-.15.13-.14.14-.12.15-.11.16-.09.16-.08.16-.06.16-.05.17-.04.17-.02.17-.01h.17l.16.01.31.05.29.08.28.11.26.14.25.16.23.19.21.2.19.22.16.23.14.23.12.23.09.22.07.21.05.18.03.15.02.12.01.06v.05l-.01.05-.02.07-.03.08-.04.1-.05.13-.07.15-.08.16-.14.23-.42.62-1.65 2.25-.01.01-.01.01c-.23.35-.18.82.13 1.1l4.33 3.85a.75.75 0 0 0 1-.04l9.4-8.6c.32-.29.32-.8 0-1.1L13.86 2.08a.75.75 0 0 0-1 0z"/>
                </svg>
                Obsidian Note
              </label>
              <input type="text" id="obsidian-note" placeholder="Project Note Name" value="${project.obsidianNote || ''}" class="link-input">
            </div>

            <div class="link-note">
              <p>💡 <strong>Tip:</strong> These links will appear as clean icons next to your project name for quick access.</p>
            </div>
          </div>
        </div>

        <div class="project-links-actions">
          <button class="link-btn link-btn--secondary" data-action="close">Cancel</button>
          <button class="link-btn link-btn--primary" id="save-links-submit">Save Links</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event handlers
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop') || e.target.dataset.action === 'close') {
        document.body.removeChild(modal);
        return;
      }

      if (e.target.id === 'save-links-submit') {
        this.saveProjectLinks(modal, projectId);
      }
    });

    // Enter key handler
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.classList.contains('link-input')) {
        this.saveProjectLinks(modal, projectId);
      }
      if (e.key === 'Escape') {
        document.body.removeChild(modal);
      }
    });

    // Focus first input
    setTimeout(() => {
      const firstInput = modal.querySelector('#github-url');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  /**
   * Save project links from modal
   */
  saveProjectLinks(modal, projectId) {
    const project = this.projects.find((p) => p.id === projectId);
    if (!project) {
      console.error('❌ Project not found:', projectId);
      return;
    }

    // Get all link values
    const githubUrl = modal.querySelector('#github-url').value.trim();
    const websiteUrl = modal.querySelector('#website-url').value.trim();
    const databaseUrl = modal.querySelector('#database-url').value.trim();
    const hostingUrl = modal.querySelector('#hosting-url').value.trim();
    const obsidianNote = modal.querySelector('#obsidian-note').value.trim();

    // Update project with new links
    this.updateProject(projectId, 'githubUrl', githubUrl);
    this.updateProject(projectId, 'websiteUrl', websiteUrl);
    this.updateProject(projectId, 'databaseUrl', databaseUrl);
    this.updateProject(projectId, 'hostingUrl', hostingUrl);
    this.updateProject(projectId, 'obsidianNote', obsidianNote);

    // Show success notification
    const linkCount = [githubUrl, websiteUrl, databaseUrl, hostingUrl, obsidianNote].filter(Boolean).length;
    this.showNotification(`✅ Updated ${linkCount} project links for "${project.name}"`);

    // Re-render table to show new links
    this.render();

    document.body.removeChild(modal);
  }

  /**
   * Submit project work to task hub
   */
  submitProjectWork(modal, projectId, projectName) {
    const description = modal.querySelector('#work-description').value.trim();
    const estimatedHours = parseFloat(modal.querySelector('#estimated-hours').value);

    if (!description) {
      alert("Please describe what you'll work on");
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
      maxWidth: '300px',
    });

    document.body.appendChild(notification);
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, duration);
  }
}
