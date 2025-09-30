export class SimpleBrainDump {
  constructor(container, dataManager, taskHub = null) {
    this.container = container;
    this.data = dataManager;
    this.taskHub = taskHub;
    this.draggedItem = null;
    this.items = [];
    this.unsubscribe = null;

    if (this.container) {
      this.init();
    } else {
      console.warn('SimpleBrainDump: Container not found');
    }
  }

  init() {
    this.render();
    this.attachEventListeners();
    this.loadExistingItems();
    this.subscribeToData(); // Subscribe after loading to ensure we get updates
  }

  subscribeToData() {
    if (!this.data || !this.data.subscribe) {
      return;
    }

    try {
      this.unsubscribe = this.data.subscribe('simpleBrainDumpItems', (newItems) => {
        this.renderItemsFromData(Array.isArray(newItems) ? newItems : []);
      });
    } catch (error) {
      console.warn('Failed to subscribe to brain dump data changes:', error);
      // Continue without real-time sync - data will be loaded from localStorage
    }
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="simple-brain-dump">
        <!-- Brain Dump Input Area -->
        <div class="brain-dump-input">
          <textarea
            class="brain-dump-textarea"
            placeholder="Dump everything on your mind here... separate items with commas (e.g., take out trash, return package, respond to email)"
            rows="3"
          ></textarea>
          <button class="done-btn">DONE - Create Tasks</button>
        </div>

        <!-- Priority Sections -->
        <div class="priority-sections">
          <div class="priority-section high-priority" data-priority="high">
            <h4>🔥 High Priority</h4>
            <div class="priority-items" data-priority="high"></div>
            <div class="empty-state">Drag high priority items here</div>
          </div>

          <div class="priority-section low-priority" data-priority="low">
            <h4>🌱 Low Priority</h4>
            <div class="priority-items" data-priority="low"></div>
            <div class="empty-state">Drag low priority items here</div>
          </div>
        </div>

        <!-- Unsorted Items (appears after processing) -->
        <div class="unsorted-section" style="display: none;">
          <h4>📝 Unsorted Items</h4>
          <div class="unsorted-items"></div>
          <p class="help-text">Drag these items into priority sections above</p>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    if (!this.container) return;

    const doneBtn = this.container.querySelector('.done-btn');
    const textarea = this.container.querySelector('.brain-dump-textarea');

    // Handle DONE button click
    if (doneBtn) {
      doneBtn.addEventListener('click', () => this.processBrainDump());
    }

    // Handle Enter+Ctrl for quick processing
    if (textarea) {
      textarea.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
          this.processBrainDump();
        }
      });
    }

    // Set up drag and drop for priority sections
    this.setupDragAndDrop();
  }

  processBrainDump() {
    const textarea = this.container.querySelector('.brain-dump-textarea');
    const text = textarea.value.trim();

    if (!text) {
      this.showNotification('⚠️ Please enter some thoughts first!', 'warning');
      return;
    }

    // Split by commas or newlines and clean up
    const items = text
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (items.length === 0) {
      this.showNotification(
        '⚠️ No valid items found. Try separating items with commas.',
        'warning'
      );
      return;
    }

    // Create draggable items
    this.createDraggableItems(items);

    // Clear the textarea
    textarea.value = '';

    // Show success message
    this.showNotification(
      `✅ Created ${items.length} items! Drag them to priority sections.`,
      'success'
    );

    // Show the unsorted section
    this.container.querySelector('.unsorted-section').style.display = 'block';
  }

  createDraggableItems(items) {
    items.forEach((itemText) => {
      const itemId = Date.now() + Math.random();

      // Store in items array
      this.items.push({
        id: itemId,
        text: itemText,
        priority: 'unsorted',
      });
    });

    this.renderItemsFromData(this.items);
    this.saveItems();
  }

  createItemElement(id, text, priority, itemData = {}) {
    const item = document.createElement('div');
    item.className = `brain-item${itemData.fromProject ? ' brain-item--project' : ''}${itemData.completed ? ' completed' : ''}`;
    item.dataset.id = id;
    item.dataset.priority = priority;
    item.draggable = true;

    // Add project indicator if this item came from a project
    const projectIndicator = itemData.fromProject
      ? `<span class="project-indicator" title="From project: ${itemData.projectName}">📋</span>`
      : '';

    item.innerHTML = `
      <label class="brain-checkbox" for="brain-${id}">
        <input type="checkbox" id="brain-${id}" ${itemData.completed ? 'checked' : ''}>
        <span class="brain-checkbox-visual"></span>
      </label>
      ${projectIndicator}
      <span class="item-text ${itemData.completed ? 'completed' : ''}">${text}</span>
      <div class="item-actions">
        <button class="add-to-capacity-btn" title="Add to capacity">⚡</button>
        <button class="delete-item" title="Delete item">×</button>
      </div>
    `;

    // Add drag event listeners
    item.addEventListener('dragstart', (e) => {
      this.draggedItem = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      this.draggedItem = null;
    });

    // Add checkbox functionality
    item.querySelector('.brain-checkbox input').addEventListener('change', (e) => {
      e.stopPropagation();
      this.toggleItemCompletion(id);
    });

    // Add double-click to add to capacity
    item.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.addItemToCapacity(id, text, priority);
    });

    // Add delete functionality
    item.querySelector('.delete-item').addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteItem(id);
    });

    // Add capacity button functionality
    item.querySelector('.add-to-capacity-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.addItemToCapacity(id, text, priority);
    });

    return item;
  }

  setupDragAndDrop() {
    // Remove existing event listeners first to prevent duplicates
    this.cleanupDragAndDrop();

    const dropZones = this.container.querySelectorAll('.priority-items, .unsorted-items');

    dropZones.forEach((zone) => {
      // Skip if already has handlers attached
      if (zone._hasDragHandlers) {
        return;
      }

      const dragoverHandler = (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
      };

      const dragleaveHandler = () => {
        zone.classList.remove('drag-over');
      };

      const dropHandler = (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');

        if (this.draggedItem) {
          const newPriority = zone.dataset.priority || 'unsorted';
          this.moveItem(this.draggedItem, newPriority);
          this.draggedItem = null; // Clear dragged item after drop
        }
      };

      // Store handlers for cleanup and mark as having handlers
      zone._dragoverHandler = dragoverHandler;
      zone._dragleaveHandler = dragleaveHandler;
      zone._dropHandler = dropHandler;
      zone._hasDragHandlers = true;

      zone.addEventListener('dragover', dragoverHandler);
      zone.addEventListener('dragleave', dragleaveHandler);
      zone.addEventListener('drop', dropHandler);
    });
  }

  cleanupDragAndDrop() {
    const dropZones = this.container.querySelectorAll('.priority-items, .unsorted-items');

    dropZones.forEach((zone) => {
      if (zone._dragoverHandler) {
        zone.removeEventListener('dragover', zone._dragoverHandler);
        delete zone._dragoverHandler;
      }
      if (zone._dragleaveHandler) {
        zone.removeEventListener('dragleave', zone._dragleaveHandler);
        delete zone._dragleaveHandler;
      }
      if (zone._dropHandler) {
        zone.removeEventListener('drop', zone._dropHandler);
        delete zone._dropHandler;
      }
      // Clear the handler flag
      delete zone._hasDragHandlers;
    });
  }

  moveItem(itemElement, newPriority) {
    const itemId = itemElement.dataset.id;
    const targetContainer = this.container.querySelector(`[data-priority="${newPriority}"]`);

    if (!targetContainer) {
      console.error('Target container not found for priority:', newPriority);
      return;
    }

    // Check if item is already in the target container
    if (targetContainer.contains(itemElement)) {
      console.log('Item already in target container, skipping move');
      return;
    }

    // Remove item from any existing container first
    const currentContainer = itemElement.parentElement;
    if (currentContainer && currentContainer !== targetContainer) {
      currentContainer.removeChild(itemElement);
    }

    // Move the element
    targetContainer.appendChild(itemElement);
    itemElement.dataset.priority = newPriority;

    // Update the data model
    const item = this.items.find((i) => i.id == itemId);
    if (item) {
      item.priority = newPriority;
    }

    this.saveItems();
    this.updateEmptyStates();

    // Show feedback
    const priorityNames = {
      high: 'High Priority',
      low: 'Low Priority',
      unsorted: 'Unsorted',
    };

    this.showNotification(`📌 Moved to ${priorityNames[newPriority]}`, 'success');
  }

  deleteItem(itemId) {
    const itemElement = this.container.querySelector(`[data-id="${itemId}"]`);
    if (itemElement) {
      itemElement.remove();
    }

    this.items = this.items.filter((item) => item.id != itemId);
    this.saveItems();
    this.updateEmptyStates();

    this.showNotification('🗑️ Item deleted', 'info');
  }

  toggleItemCompletion(id) {
    const items = this.data.get('simpleBrainDumpItems', []);
    const itemIndex = items.findIndex(item => item.id === id);
    
    if (itemIndex !== -1) {
      items[itemIndex].completed = !items[itemIndex].completed;
      this.data.set('simpleBrainDumpItems', items);
      this.renderItemsFromData();
    }
  }

  addItemToCapacity(itemId, text, priority) {
    const item = this.items.find((item) => item.id === itemId);
    if (!item) return;

    // Get task integration hub
    const taskHub = window.lifeDashboard?.modules?.taskIntegrationHub;
    if (!taskHub) {
      this.showNotification('❌ Task integration not available', 'error');
      return;
    }

    // Add to capacity with estimated time based on priority
    const estimatedHours = priority === 'high' ? 1 : priority === 'low' ? 0.5 : 0.75;

    try {
      taskHub.pullBrainItemToCapacity(itemId, text, estimatedHours);
      this.showNotification(`✅ Added "${text}" to capacity planning (${estimatedHours}h)`, 'success');
    } catch (error) {
      console.error('Failed to add brain item to capacity:', error);
      this.showNotification('❌ Failed to add to capacity', 'error');
    }
  }

  updateEmptyStates() {
    if (!this.container) return;

    const sections = ['high', 'low', 'unsorted'];

    sections.forEach((priority) => {
      const container = this.container.querySelector(`[data-priority="${priority}"]`);
      if (!container) return;

      const items = container.querySelectorAll('.brain-item');
      const emptyState = container.parentElement.querySelector('.empty-state');

      if (emptyState) {
        emptyState.style.display = items.length === 0 ? 'block' : 'none';
      }
    });
  }

  loadExistingItems() {
    if (!this.container) return;

    console.log('Brain dump: Starting to load existing items');

    try {
      // First try to get from the data manager
      const existingItems = this.data.get('simpleBrainDumpItems', []);
      const itemsArray = Array.isArray(existingItems) ? existingItems : [];
      console.log('Brain dump: Data manager returned', itemsArray.length, 'items');
      this.renderItemsFromData(itemsArray);
    } catch (error) {
      console.warn(
        'Brain dump: Failed to load from data manager, trying localStorage:',
        error
      );
      // Fallback to localStorage for offline functionality
      const localItems = localStorage.getItem('simpleBrainDumpItems');
      console.log('Brain dump: localStorage contains:', localItems ? 'data' : 'no data');
      if (localItems) {
        try {
          const parsedItems = JSON.parse(localItems);
          console.log('Brain dump: localStorage parsed', parsedItems.length, 'items');
          this.renderItemsFromData(Array.isArray(parsedItems) ? parsedItems : []);
        } catch (parseError) {
          console.error('Brain dump: Failed to parse localStorage brain dump items:', parseError);
          this.renderItemsFromData([]);
        }
      } else {
        console.log('Brain dump: No data in localStorage, rendering empty');
        this.renderItemsFromData([]);
      }
    }
  }

  saveItems() {
    try {
      this.data.set('simpleBrainDumpItems', this.items);
    } catch (error) {
      console.warn('Failed to save brain dump items to cloud storage:', error);
      // Fallback to localStorage for offline functionality
      localStorage.setItem('simpleBrainDumpItems', JSON.stringify(this.items));
    }
  }

  renderItemsFromData(items) {
    console.log('Brain dump rendering items:', items.length, items);
    this.items = items.map((item) => ({ ...item }));

    const containers = this.container.querySelectorAll('.priority-items, .unsorted-items');
    containers.forEach((container) => {
      container.innerHTML = '';
    });

    const priorityContainers = {
      high: this.container.querySelector('.priority-items[data-priority="high"]'),
      low: this.container.querySelector('.priority-items[data-priority="low"]'),
      unsorted: this.container.querySelector('.unsorted-items'),
    };

    this.items.forEach((item) => {
      const target = priorityContainers[item.priority] || priorityContainers.unsorted;
      if (!target) return;
      const element = this.createItemElement(item.id, item.text, item.priority, item);
      target.appendChild(element);
    });

    this.updateEmptyStates();

    const unsortedSection = this.container.querySelector('.unsorted-section');
    if (unsortedSection) {
      const shouldShow = this.items.length > 0;
      unsortedSection.style.display = shouldShow ? 'block' : 'none';
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `brain-notification brain-notification--${type}`;

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${
        type === 'success'
          ? '#10b981'
          : type === 'warning'
            ? '#f59e0b'
            : type === 'error'
              ? '#ef4444'
              : '#3b82f6'
      };
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }
}
