/**
 * Task Integration Hub
 * Central system for coordinating tasks between Brain Space, Capacity, Projects, and Calendar
 */
export class TaskIntegrationHub {
  constructor(dataManager) {
    this.data = dataManager;
    this.subscribers = new Map();
    this.taskListeners = new Set();

    this.init();
  }

  init() {
    // Subscribe to changes in component data
    this.data.subscribe('simpleBrainDumpItems', (newItems, oldItems) => {
      this.syncBrainSpaceToCapacity(newItems, oldItems);
    });

    this.data.subscribe('projects', (newProjects, oldProjects) => {
      this.handleProjectChanges(newProjects, oldProjects);
    });
  }

  /**
   * Create a unified task structure
   */
  createUnifiedTask(sourceData, source) {
    const baseTask = {
      id: this.generateTaskId(),
      text: sourceData.text || sourceData.name || '',
      source: source,
      priority: sourceData.priority || 'medium',
      status: sourceData.completed ? 'completed' : 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add source-specific data
    switch (source) {
      case 'brain_space':
        baseTask.brainSpaceData = {
          originalIndex: sourceData.originalIndex,
          priority: sourceData.priority,
          createdAt: sourceData.createdAt || baseTask.createdAt
        };
        break;

      case 'projects':
        baseTask.projectLink = {
          projectId: sourceData.projectId,
          projectName: sourceData.projectName,
          isActiveWork: false
        };
        break;

      case 'capacity':
        baseTask.capacityData = {
          duration: sourceData.duration || 30,
          energyWeight: sourceData.energyWeight,
          calculatedCapacity: sourceData.calculatedCapacity,
          factors: sourceData.factors || [],
          fromCalculator: sourceData.fromCalculator || false,
          fromQuickAdd: sourceData.fromQuickAdd || false
        };
        break;
    }

    return baseTask;
  }

  /**
   * Generate unique task ID
   */
  generateTaskId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Sync Brain Space tasks to Capacity automatically
   */
  syncBrainSpaceToCapacity(newBrainItems, oldBrainItems) {
    const capacityTasks = this.data.get('enoughTasks', []);
    const unifiedTasks = this.data.get('unifiedTasks', []);

    // Get current brain space items
    const brainItems = newBrainItems || [];

    // Convert brain space items to unified tasks
    const brainSpaceTasks = brainItems.map((item, index) => {
      // Check if this task already exists in unified tasks
      const existingTask = unifiedTasks.find(task =>
        task.source === 'brain_space' &&
        task.brainSpaceData?.originalIndex === index &&
        task.text === item.text
      );

      if (existingTask) {
        // Update existing task
        existingTask.status = item.completed ? 'completed' : 'active';
        existingTask.priority = item.priority;
        existingTask.updatedAt = new Date().toISOString();
        return existingTask;
      } else {
        // Create new unified task
        return this.createUnifiedTask({
          ...item,
          originalIndex: index
        }, 'brain_space');
      }
    });

    // Update unified tasks (remove old brain space tasks, add new ones)
    const nonBrainSpaceTasks = unifiedTasks.filter(task => task.source !== 'brain_space');
    const newUnifiedTasks = [...nonBrainSpaceTasks, ...brainSpaceTasks];

    this.data.set('unifiedTasks', newUnifiedTasks);

    // Sync to capacity - only HIGH PRIORITY brain space tasks
    const brainSpaceCapacityTasks = brainSpaceTasks
      .filter(task => task.status === 'active' && task.priority === 'high')
      .map(task => this.convertToCapacityFormat(task));

    // Keep existing capacity tasks that aren't from brain space
    const nonBrainSpaceCapacityTasks = capacityTasks.filter(task =>
      !task.fromBrainSpace
    );

    // Combine and update capacity tasks
    const newCapacityTasks = [...nonBrainSpaceCapacityTasks, ...brainSpaceCapacityTasks];
    this.data.set('enoughTasks', newCapacityTasks);

    this.notifyListeners('capacity_updated', newCapacityTasks);
  }

  /**
   * Convert unified task to capacity format
   */
  convertToCapacityFormat(unifiedTask) {
    const baseCapacity = this.estimateEnergyFromPriority(unifiedTask.priority);

    return {
      id: unifiedTask.id,
      text: unifiedTask.text,
      duration: 30, // Default duration
      energyWeight: baseCapacity,
      completed: unifiedTask.status === 'completed',
      created: unifiedTask.createdAt,
      fromBrainSpace: true,
      unifiedTaskId: unifiedTask.id,
      priority: unifiedTask.priority
    };
  }

  /**
   * Estimate energy based on priority level
   */
  estimateEnergyFromPriority(priority) {
    const energyMap = {
      'high': 25,
      'medium': 15,
      'low': 8
    };
    return energyMap[priority] || 15;
  }

  /**
   * Pull project task into daily work (capacity planning)
   */
  pullProjectTaskToDaily(projectId, projectName, taskDescription, estimatedHours = 2) {
    const unifiedTasks = this.data.get('unifiedTasks', []);
    const capacityTasks = this.data.get('enoughTasks', []);

    // Create unified task for project work
    const projectTask = this.createUnifiedTask({
      text: taskDescription,
      projectId: projectId,
      projectName: projectName
    }, 'projects');

    // Mark as active work
    projectTask.projectLink.isActiveWork = true;
    projectTask.capacityData = {
      duration: estimatedHours * 60, // Convert to minutes
      energyWeight: estimatedHours * 20, // 20% per hour estimate
      calculatedCapacity: Math.min(100, estimatedHours * 20),
      factors: ['project-work'],
      scheduledFor: new Date().toISOString().split('T')[0]
    };

    // Add to unified tasks
    unifiedTasks.push(projectTask);
    this.data.set('unifiedTasks', unifiedTasks);

    // Add to capacity tasks
    const capacityTask = {
      id: projectTask.id,
      text: `[${projectName}] ${taskDescription}`,
      duration: estimatedHours * 60,
      energyWeight: estimatedHours * 20,
      calculatedCapacity: Math.min(100, estimatedHours * 20),
      completed: false,
      created: new Date().toISOString(),
      fromProject: true,
      projectId: projectId,
      projectName: projectName,
      unifiedTaskId: projectTask.id
    };

    capacityTasks.push(capacityTask);
    this.data.set('enoughTasks', capacityTasks);

    this.notifyListeners('project_task_added', {
      projectTask,
      capacityTask
    });

    return projectTask;
  }

  /**
   * Mark task as completed across all components
   */
  completeTask(unifiedTaskId) {
    const unifiedTasks = this.data.get('unifiedTasks', []);
    const task = unifiedTasks.find(t => t.id === unifiedTaskId);

    if (!task) return;

    task.status = 'completed';
    task.updatedAt = new Date().toISOString();

    // Update in unified tasks
    this.data.set('unifiedTasks', unifiedTasks);

    // Update in capacity
    const capacityTasks = this.data.get('enoughTasks', []);
    const capacityTask = capacityTasks.find(t => t.unifiedTaskId === unifiedTaskId);
    if (capacityTask) {
      capacityTask.completed = true;
      this.data.set('enoughTasks', capacityTasks);
    }

    // Update in brain space if applicable
    if (task.source === 'brain_space') {
      const brainItems = this.data.get('simpleBrainDumpItems', []);
      const brainItem = brainItems[task.brainSpaceData?.originalIndex];
      if (brainItem) {
        brainItem.completed = true;
        this.data.set('simpleBrainDumpItems', brainItems);
      }
    }

    this.notifyListeners('task_completed', task);
  }

  /**
   * Get tasks for a specific component view
   */
  getTasksForComponent(component, filters = {}) {
    const unifiedTasks = this.data.get('unifiedTasks', []);

    let filteredTasks = unifiedTasks.filter(task => {
      if (filters.status && task.status !== filters.status) return false;
      if (filters.source && task.source !== filters.source) return false;
      if (filters.activeProjectWork && !task.projectLink?.isActiveWork) return false;
      return true;
    });

    // Component-specific formatting
    switch (component) {
      case 'capacity':
        return filteredTasks
          .filter(task =>
            (task.source === 'brain_space' && task.priority === 'high') ||
            task.projectLink?.isActiveWork
          )
          .map(task => this.convertToCapacityFormat(task));

      case 'brain_space':
        return filteredTasks.filter(task => task.source === 'brain_space');

      case 'projects_daily':
        return filteredTasks.filter(task => task.projectLink?.isActiveWork);

      default:
        return filteredTasks;
    }
  }

  /**
   * Handle project changes (for future project-specific integrations)
   */
  handleProjectChanges(newProjects, oldProjects) {
    // Future: Handle project updates, deletions, etc.
    this.notifyListeners('projects_updated', newProjects);
  }

  /**
   * Add listener for integration events
   */
  addListener(callback) {
    this.taskListeners.add(callback);
    return () => this.taskListeners.delete(callback);
  }

  /**
   * Notify all listeners of integration events
   */
  notifyListeners(eventType, data) {
    this.taskListeners.forEach(callback => {
      try {
        callback(eventType, data);
      } catch (error) {
        console.error('Task integration listener error:', error);
      }
    });
  }

  /**
   * Get unified task overview for debugging/monitoring
   */
  getTaskOverview() {
    const unifiedTasks = this.data.get('unifiedTasks', []);

    return {
      total: unifiedTasks.length,
      bySource: {
        brain_space: unifiedTasks.filter(t => t.source === 'brain_space').length,
        projects: unifiedTasks.filter(t => t.source === 'projects').length,
        capacity: unifiedTasks.filter(t => t.source === 'capacity').length
      },
      byStatus: {
        active: unifiedTasks.filter(t => t.status === 'active').length,
        completed: unifiedTasks.filter(t => t.status === 'completed').length
      },
      activeProjectWork: unifiedTasks.filter(t => t.projectLink?.isActiveWork).length
    };
  }
}