/**
 * 装备系统
 * 管理角色的装备：武器、衣服、项链、靴子
 */
export class EquipmentSystem {
    constructor() {
        this.equipment = {
            weapon: null,    // 武器
            armor: null,     // 衣服
            necklace: null,  // 项链
            boots: null      // 靴子
        };
    }

    /**
     * 装备物品
     * @param {Item} item 要装备的物品
     * @returns {Item|null} 返回被替换的装备（如果有）
     */
    equip(item) {
        if (!item || !item.isEquipment) {
            return null;
        }

        const slot = item.equipmentSlot;
        if (!slot || !this.equipment.hasOwnProperty(slot)) {
            return null;
        }

        const oldEquipment = this.equipment[slot];
        this.equipment[slot] = item;
        return oldEquipment;
    }

    /**
     * 卸下装备
     * @param {string} slot 装备槽位
     * @returns {Item|null} 被卸下的装备
     */
    unequip(slot) {
        if (!this.equipment.hasOwnProperty(slot)) {
            return null;
        }

        const equipment = this.equipment[slot];
        this.equipment[slot] = null;
        return equipment;
    }

    /**
     * 获取装备
     * @param {string} slot 装备槽位
     * @returns {Item|null}
     */
    getEquipment(slot) {
        return this.equipment[slot] || null;
    }

    /**
     * 获取所有装备
     * @returns {Object}
     */
    getAllEquipment() {
        return { ...this.equipment };
    }

    /**
     * 计算总属性加成
     * @returns {Object} 属性加成对象
     */
    getTotalStats() {
        const stats = {
            attack: 0,      // 攻击力
            critRate: 0,     // 暴击率（百分比）
            lifesteal: 0,    // 吸血
            magicResist: 0  // 魔抗
        };

        Object.values(this.equipment).forEach(equipment => {
            if (equipment && equipment.stats) {
                stats.attack += equipment.stats.attack || 0;
                stats.critRate += equipment.stats.critRate || 0;
                stats.lifesteal += equipment.stats.lifesteal || 0;
                stats.magicResist += equipment.stats.magicResist || 0;
            }
        });

        return stats;
    }

    /**
     * 清空所有装备
     */
    clear() {
        this.equipment = {
            weapon: null,
            armor: null,
            necklace: null,
            boots: null
        };
    }
}


