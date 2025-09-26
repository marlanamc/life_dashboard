export class SimpleBrainDump {
  constructor(container, dataManager, taskHub = null) {
    this.container = container;
    this.data = dataManager;
    this.taskHub = taskHub;
    this.draggedItem = null;
    this.items = [];

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

          <div class="priority-section medium-priority" data-priority="medium">
            <h4>⚡ Medium Priority</h4>
            <div class="priority-items" data-priority="medium"></div>
            <div class="empty-state">Drag medium priority items here</div>
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
    doneBtn.addEventListener('click', () => this.processBrainDump());

    // Handle Enter+Ctrl for quick processing
    textarea.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        this.processBrainDump();
      }
    });

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

    // Split by commas and clean up
    const items = text
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    if (items.length === 0) {
      this.showNotification('⚠️ No valid items found. Try separating items with commas.', 'warning');
      return;
    }

    // Create draggable items
    this.createDraggableItems(items);

    // Clear the textarea
    textarea.value = '';

    // Show success message
    this.showNotification(`✅ Created ${items.length} items! Drag them to priority sections.`, 'success');

    // Show the unsorted section
    this.container.querySelector('.unsorted-section').style.display = 'block';
  }

  createDraggableItems(items) {
    const unsortedContainer = this.container.querySelector('.unsorted-items');

    items.forEach(itemText => {
      const itemId = Date.now() + Math.random();
      const itemElement = this.createItemElement(itemId, itemText, 'unsorted');
      unsortedContainer.appendChild(itemElement);

      // Store in items array
      this.items.push({
        id: itemId,
        text: itemText,
        priority: 'unsorted'
      });
    });

    this.saveItems();
  }

  createItemElement(id, text, priority) {
    const item = document.createElement('div');
    item.className = 'brain-item';
    item.dataset.id = id;
    item.dataset.priority = priority;
    item.draggable = true;

    item.innerHTML = `
      <span class="item-text">${text}</span>
      <button class="delete-item" title="Delete item">×</button>
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

    // Add delete functionality
    item.querySelector('.delete-item').addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteItem(id);
    });

    return item;
  }

  setupDragAndDrop() {
    const dropZones = this.container.querySelectorAll('.priority-items, .unsorted-items');

    dropZones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
      });

      zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');

        if (this.draggedItem) {
          const newPriority = zone.dataset.priority;
          this.moveItem(this.draggedItem, newPriority);
        }
      });
    });
  }

  moveItem(itemElement, newPriority) {
    const itemId = itemElement.dataset.id;
    const targetContainer = this.container.querySelector(`[data-priority="${newPriority}"]`);

    // Move DOM element
    targetContainer.appendChild(itemElement);
    itemElement.dataset.priority = newPriority;

    // Update data
    const item = this.items.find(i => i.id == itemId);
    if (item) {
      item.priority = newPriority;
    }

    this.saveItems();
    this.updateEmptyStates();

    // Show feedback
    const priorityNames = {
      high: 'High Priority',
      medium: 'Medium Priority',
      low: 'Low Priority',
      unsorted: 'Unsorted'
    };

    this.showNotification(`📌 Moved to ${priorityNames[newPriority]}`, 'success');
  }

  deleteItem(itemId) {
    const itemElement = this.container.querySelector(`[data-id="${itemId}"]`);
    if (itemElement) {
      itemElement.remove();
    }

    this.items = this.items.filter(item => item.id != itemId);
    this.saveItems();
    this.updateEmptyStates();

    this.showNotification('🗑️ Item deleted', 'info');
  }

  updateEmptyStates() {
    if (!this.container) return;
    
    const sections = ['high', 'medium', 'low', 'unsorted'];

    sections.forEach(priority => {
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
    
    const existingItems = this.data.get('simpleBrainDumpItems', []);

    existingItems.forEach(item => {
      const itemElement = this.createItemElement(item.id, item.text, item.priority);
      const container = this.container.querySelector(`[data-priority="${item.priority}"]`);
      if (container) {
        container.appendChild(itemElement);
      }
    });

    this.items = [...existingItems];
    this.updateEmptyStates();

    // Show unsorted section if there are unsorted items
    const hasUnsorted = existingItems.some(item => item.priority === 'unsorted');
    if (hasUnsorted) {
      this.container.querySelector('.unsorted-section').style.display = 'block';
    }
  }

  saveItems() {
    this.data.set('simpleBrainDumpItems', this.items);
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `brain-notification brain-notification--${type}`;

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' :
                   type === 'warning' ? '#f59e0b' :
                   type === 'error' ? '#ef4444' : '#3b82f6'};
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