/**
 * TickTick Service
 * Handles integration with TickTick API for task synchronization
 */
export class TickTickService {
  constructor(dataManager) {
    this.data = dataManager;
    this.apiBase = 'https://api.ticktick.com/api/v2';
    this.isAuthenticated = false;
    this.accessToken = null;
    this.userId = null;
    this.lists = [];
    
    this.init();
  }

  init() {
    // Load saved authentication data
    this.accessToken = this.data.get('ticktick_access_token', null);
    this.userId = this.data.get('ticktick_user_id', null);
    this.lists = this.data.get('ticktick_lists', []);
    
    if (this.accessToken) {
      this.isAuthenticated = true;
      this.loadUserLists();
    }
  }

  /**
   * Authenticate with TickTick using OAuth2
   * This would typically redirect to TickTick's OAuth page
   */
  async authenticate() {
    try {
      // For now, we'll use a manual token approach
      // In a real implementation, you'd use OAuth2 flow
      const token = prompt('Enter your TickTick API token:');
      if (token) {
        this.accessToken = token;
        this.data.set('ticktick_access_token', token);
        this.isAuthenticated = true;
        await this.loadUserInfo();
        await this.loadUserLists();
        return true;
      }
      return false;
    } catch (error) {
      console.error('TickTick authentication failed:', error);
      return false;
    }
  }

  /**
   * Load user information from TickTick
   */
  async loadUserInfo() {
    try {
      const response = await this.makeRequest('/user/profile');
      this.userId = response.id;
      this.data.set('ticktick_user_id', this.userId);
      return response;
    } catch (error) {
      console.error('Failed to load user info:', error);
      throw error;
    }
  }

  /**
   * Load user's lists/projects from TickTick
   */
  async loadUserLists() {
    try {
      const response = await this.makeRequest('/project');
      this.lists = response || [];
      this.data.set('ticktick_lists', this.lists);
      return this.lists;
    } catch (error) {
      console.error('Failed to load user lists:', error);
      throw error;
    }
  }

  /**
   * Get tasks from a specific list
   */
  async getTasks(listId = null) {
    try {
      const endpoint = listId ? `/project/${listId}/data` : '/task';
      const response = await this.makeRequest(endpoint);
      return response.tasks || [];
    } catch (error) {
      console.error('Failed to load tasks:', error);
      throw error;
    }
  }

  /**
   * Create a new task in TickTick
   */
  async createTask(taskData) {
    try {
      const task = {
        title: taskData.title || taskData.name,
        content: taskData.content || taskData.description || '',
        projectId: taskData.projectId || this.getDefaultListId(),
        priority: this.mapPriority(taskData.priority),
        dueDate: taskData.dueDate || null,
        tags: taskData.tags || [],
        status: 0, // 0 = active, 1 = completed
        ...taskData
      };

      const response = await this.makeRequest('/task', {
        method: 'POST',
        body: JSON.stringify(task)
      });

      return response;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(taskId, updates) {
    try {
      const response = await this.makeRequest(`/task/${taskId}`, {
        method: 'POST',
        body: JSON.stringify(updates)
      });

      return response;
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }

  /**
   * Complete a task
   */
  async completeTask(taskId) {
    try {
      const response = await this.makeRequest(`/task/${taskId}/complete`, {
        method: 'POST'
      });

      return response;
    } catch (error) {
      console.error('Failed to complete task:', error);
      throw error;
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId) {
    try {
      const response = await this.makeRequest(`/task/${taskId}`, {
        method: 'DELETE'
      });

      return response;
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }

  /**
   * Sync capacity planner tasks with TickTick
   */
  async syncCapacityTasks(capacityTasks) {
    try {
      const ticktickTasks = [];
      
      for (const task of capacityTasks) {
        const ticktickTask = await this.createTask({
          title: task.text,
          content: `Duration: ${task.duration} minutes`,
          priority: task.priority || 'medium',
          tags: ['life-dashboard', 'capacity-planner']
        });
        
        ticktickTasks.push({
          localId: task.id,
          ticktickId: ticktickTask.id,
          synced: true
        });
      }

      this.data.set('ticktick_synced_tasks', ticktickTasks);
      return ticktickTasks;
    } catch (error) {
      console.error('Failed to sync capacity tasks:', error);
      throw error;
    }
  }

  /**
   * Sync brain dump items with TickTick
   */
  async syncBrainDumpItems(brainDumpItems) {
    try {
      const ticktickTasks = [];
      
      for (const item of brainDumpItems) {
        const ticktickTask = await this.createTask({
          title: item.text,
          content: `From brain dump - Priority: ${item.priority || 'unsorted'}`,
          priority: item.priority || 'low',
          tags: ['life-dashboard', 'brain-dump']
        });
        
        ticktickTasks.push({
          localId: item.id,
          ticktickId: ticktickTask.id,
          synced: true
        });
      }

      this.data.set('ticktick_synced_brain_dump', ticktickTasks);
      return ticktickTasks;
    } catch (error) {
      console.error('Failed to sync brain dump items:', error);
      throw error;
    }
  }

  /**
   * Get default list ID (Inbox or first available list)
   */
  getDefaultListId() {
    const inbox = this.lists.find(list => list.name === 'Inbox');
    if (inbox) return inbox.id;
    return this.lists[0]?.id || null;
  }

  /**
   * Map priority from our system to TickTick's system
   */
  mapPriority(priority) {
    const priorityMap = {
      'high': 4,
      'medium': 3,
      'low': 2,
      'none': 1
    };
    return priorityMap[priority] || 3;
  }

  /**
   * Map priority from TickTick's system to our system
   */
  mapPriorityFromTickTick(priority) {
    const priorityMap = {
      4: 'high',
      3: 'medium',
      2: 'low',
      1: 'none'
    };
    return priorityMap[priority] || 'medium';
  }

  /**
   * Make authenticated request to TickTick API
   */
  async makeRequest(endpoint, options = {}) {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated with TickTick');
    }

    const url = `${this.apiBase}${endpoint}`;
    const config = {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`TickTick API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Disconnect from TickTick
   */
  disconnect() {
    this.isAuthenticated = false;
    this.accessToken = null;
    this.userId = null;
    this.lists = [];
    
    this.data.set('ticktick_access_token', null);
    this.data.set('ticktick_user_id', null);
    this.data.set('ticktick_lists', []);
    this.data.set('ticktick_synced_tasks', []);
    this.data.set('ticktick_synced_brain_dump', []);
  }

  /**
   * Check if service is ready
   */
  isReady() {
    return this.isAuthenticated && this.accessToken && this.lists.length > 0;
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isAuthenticated: this.isAuthenticated,
      hasToken: !!this.accessToken,
      hasLists: this.lists.length > 0,
      isReady: this.isReady()
    };
  }
}
