/**
 * 背包UI
 */
import { Inventory } from '../game/Inventory.js';

export class InventoryUI {
    constructor(container, inventory, onUseItem, onDeleteItem, onToggle, onEquipItem = null) {
        this.container = container;
        this.inventory = inventory;
        this.onUseItem = onUseItem;
        this.onDeleteItem = onDeleteItem;
        this.onToggle = onToggle; // 切换时的回调
        this.onEquipItem = onEquipItem; // 装备物品的回调
        this.isOpen = false; // 默认关闭背包
        this.contextMenu = null;
        this.selectedItemIndex = -1;
        this.init();
    }

    init() {
        this.render();
        this.attachEvents();
    }

    render() {
        const items = this.inventory.getItems();
        const slots = [];

        for (let i = 0; i < this.inventory.maxSlots; i++) {
            if (i < items.length) {
                const item = items[i];
                slots.push(`
                    <div class="inventory-slot inventory-item ${item.used ? 'used' : ''}" 
                         data-index="${i}">
                        <span class="item-icon">${item.getIcon()}</span>
                        <span class="item-name">${item.name}</span>
                    </div>
                `);
            } else {
                slots.push('<div class="inventory-slot empty-slot"></div>');
            }
        }

        this.container.innerHTML = `
            <div class="inventory-overlay"></div>
            <div class="inventory-content">
                <div class="inventory-header">
                    <h3>背包 (${items.length}/${this.inventory.maxSlots})</h3>
                    <button class="close-inventory">×</button>
                </div>
                <div class="inventory-items">
                    ${slots.join('')}
                </div>
            </div>
        `;

        this.attachSlotEvents();
    }

    attachEvents() {
        const closeBtn = this.container.querySelector('.close-inventory');
        const overlay = this.container.querySelector('.inventory-overlay');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const isOpen = this.toggle();
                // 通知外部背包状态变化
                if (this.onToggle) {
                    this.onToggle(isOpen);
                }
            });
        }

        // 点击遮罩层也可以关闭背包
        if (overlay) {
            overlay.addEventListener('click', () => {
                const isOpen = this.toggle();
                if (this.onToggle) {
                    this.onToggle(isOpen);
                }
            });
        }
    }

    attachSlotEvents() {
        const slots = this.container.querySelectorAll('.inventory-item');
        slots.forEach(slot => {
            const index = parseInt(slot.getAttribute('data-index'));
            const item = this.inventory.getItem(index);

            if (item && !item.used) {
                // 右键菜单
                slot.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.showContextMenu(e, index);
                });

                // 左键使用
                slot.addEventListener('click', () => {
                    this.useItem(index);
                });
            }
        });
    }

    showContextMenu(event, itemIndex) {
        this.closeContextMenu();

        const item = this.inventory.getItem(itemIndex);
        if (!item || item.used) return;

        this.selectedItemIndex = itemIndex;

        this.contextMenu = document.createElement('div');
        this.contextMenu.className = 'context-menu';
        this.contextMenu.style.left = event.pageX + 'px';
        this.contextMenu.style.top = event.pageY + 'px';

        // 根据物品类型显示不同的菜单项
        let menuItems = '';
        if (item.isEquipment) {
            menuItems = `
                <div class="context-menu-item" data-action="equip">装备</div>
                <div class="context-menu-item" data-action="delete">删除</div>
            `;
        } else {
            menuItems = `
                <div class="context-menu-item" data-action="use">使用</div>
                <div class="context-menu-item" data-action="delete">删除</div>
            `;
        }

        this.contextMenu.innerHTML = menuItems;

        this.contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                if (action === 'use') {
                    this.useItem(itemIndex);
                } else if (action === 'equip') {
                    this.equipItem(itemIndex);
                } else if (action === 'delete') {
                    this.deleteItem(itemIndex);
                }
                this.closeContextMenu();
            });
        });

        document.body.appendChild(this.contextMenu);

        setTimeout(() => {
            document.addEventListener('click', () => this.closeContextMenu(), { once: true });
            document.addEventListener('contextmenu', () => this.closeContextMenu(), { once: true });
        }, 10);
    }

    closeContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.remove();
            this.contextMenu = null;
        }
        this.selectedItemIndex = -1;
    }

    useItem(index) {
        if (this.onUseItem) {
            this.onUseItem(index);
        }
        this.update();
    }

    deleteItem(index) {
        if (this.onDeleteItem) {
            this.onDeleteItem(index);
        }
        this.update();
    }

    equipItem(index) {
        if (this.onEquipItem) {
            this.onEquipItem(index);
        }
        this.update();
    }

    update() {
        this.render();
    }

    toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.container.style.display = 'block';
            this.container.classList.add('show');
        } else {
            this.container.classList.remove('show');
            // 等待动画完成后再隐藏
            setTimeout(() => {
                if (!this.isOpen) {
                    this.container.style.display = 'none';
                }
            }, 300);
        }
        return this.isOpen;
    }

    show() {
        this.isOpen = true;
        this.container.style.display = 'block';
        this.container.classList.add('show');
    }

    hide() {
        this.isOpen = false;
        this.container.classList.remove('show');
        // 等待动画完成后再隐藏
        setTimeout(() => {
            if (!this.isOpen) {
                this.container.style.display = 'none';
            }
        }, 300);
    }

    isInventoryOpen() {
        return this.isOpen;
    }

    dispose() {
        this.closeContextMenu();
        this.container.innerHTML = '';
    }
}

