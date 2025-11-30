/**
 * 道具类
 */
import { GameConfig } from '../config/GameConfig.js';

export class Item {
    constructor(id, name, level, options = {}) {
        this.id = id;
        this.name = name;
        this.level = level;
        this.used = false;

        // 装备相关属性
        this.isEquipment = options.isEquipment || false;
        this.equipmentSlot = options.equipmentSlot || null; // 'weapon', 'armor', 'necklace', 'boots'
        this.stats = options.stats || null; // { attack, critRate, lifesteal, magicResist }
        this.itemType = options.itemType || 'consumable'; // 'consumable' 或 'equipment'
    }

    /**
     * 使用道具
     * @returns {Object} 道具效果配置
     */
    use() {
        // 如果是装备，不能使用
        if (this.isEquipment) {
            return null;
        }

        if (this.used) {
            return null;
        }

        this.used = true;

        if (this.name === '加速药水') {
            return {
                type: 'speed',
                multiplier: GameConfig.itemEffects.speedPotion.multiplier,
                duration: GameConfig.itemEffects.speedPotion.duration
            };
        } else if (this.name === '弹跳药水') {
            return {
                type: 'jump',
                multiplier: GameConfig.itemEffects.jumpPotion.multiplier,
                duration: GameConfig.itemEffects.jumpPotion.duration
            };
        } else if (this.name === '回血药水') {
            return {
                type: 'heal',
                amount: 50 // 恢复50%最大血量（在main.js中处理）
            };
        }

        return null;
    }

    /**
     * 获取图标
     */
    getIcon() {
        if (this.isEquipment) {
            switch (this.equipmentSlot) {
                case 'weapon':
                    return '⚔️';
                case 'armor':
                    return '🛡️';
                case 'necklace':
                    return '💎';
                case 'boots':
                    return '👢';
                default:
                    return '📦';
            }
        }
        if (this.name === '加速药水') return '⚡';
        if (this.name === '弹跳药水') return '🦘';
        if (this.name === '回血药水') return '❤️';
        return '📦';
    }

    /**
     * 创建Boss掉落的武器
     * @param {number} level 关卡等级
     * @returns {Item}
     */
    static createBossWeapon(level) {
        // 根据关卡等级生成不同属性的武器
        const baseAttack = 10 + level * 5;
        const baseCritRate = 5 + level * 2;
        const baseLifesteal = 2 + level;

        return new Item(
            `boss_weapon_${level}_${Date.now()}`,
            `Boss武器 Lv.${level}`,
            level,
            {
                isEquipment: true,
                equipmentSlot: 'weapon',
                itemType: 'equipment',
                stats: {
                    attack: baseAttack,
                    critRate: baseCritRate,
                    lifesteal: baseLifesteal,
                    magicResist: 0
                }
            }
        );
    }
}


