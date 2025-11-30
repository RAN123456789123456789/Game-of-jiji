/**
 * 背包系统
 */
import { GameConfig } from '../config/GameConfig.js';
import { Item } from './Item.js';

export class Inventory {
    constructor() {
        this.items = [];
        this.maxSlots = GameConfig.inventory.maxSlots;
    }

    /**
     * 添加物品
     * @param {Item} item 
     * @returns {boolean} 是否添加成功
     */
    addItem(item) {
        if (this.items.length >= this.maxSlots) {
            return false;
        }
        this.items.push(item);
        return true;
    }

    /**
     * 移除物品
     * @param {number} index 
     */
    removeItem(index) {
        if (index >= 0 && index < this.items.length) {
            this.items.splice(index, 1);
        }
    }

    /**
     * 使用物品
     * @param {number} index 
     * @returns {Object|null} 道具效果
     */
    useItem(index) {
        if (index >= 0 && index < this.items.length) {
            const item = this.items[index];
            const effect = item.use();
            return effect;
        }
        return null;
    }

    /**
     * 获取物品
     * @param {number} index 
     * @returns {Item|null}
     */
    getItem(index) {
        if (index >= 0 && index < this.items.length) {
            return this.items[index];
        }
        return null;
    }

    /**
     * 获取所有物品
     */
    getItems() {
        return this.items;
    }

    /**
     * 检查是否已满
     */
    isFull() {
        return this.items.length >= this.maxSlots;
    }

    /**
     * 清空背包
     */
    clear() {
        this.items = [];
    }
}


