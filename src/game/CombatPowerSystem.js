/**
 * 战力系统
 * 根据权重计算角色战力
 */
export class CombatPowerSystem {
    constructor() {
        // 属性权重配置
        this.weights = {
            attack: 1.0,        // 攻击力权重：1点攻击力 = 1点战力
            critRate: 2.0,      // 暴击率权重：1%暴击率 = 2点战力
            lifesteal: 1.5,     // 吸血权重：1点吸血 = 1.5点战力
            magicResist: 1.2,   // 魔抗权重：1点魔抗 = 1.2点战力
            health: 0.1         // 血量权重：1点血量 = 0.1点战力
        };
    }

    /**
     * 计算战力
     * @param {Object} stats 属性对象
     * @param {number} stats.attack 攻击力
     * @param {number} stats.critRate 暴击率（百分比）
     * @param {number} stats.lifesteal 吸血
     * @param {number} stats.magicResist 魔抗
     * @param {number} stats.health 血量（可选）
     * @returns {number} 战力值
     */
    calculatePower(stats) {
        let power = 0;

        power += (stats.attack || 0) * this.weights.attack;
        power += (stats.critRate || 0) * this.weights.critRate;
        power += (stats.lifesteal || 0) * this.weights.lifesteal;
        power += (stats.magicResist || 0) * this.weights.magicResist;
        power += (stats.health || 0) * this.weights.health;

        return Math.round(power);
    }

    /**
     * 设置权重
     * @param {Object} weights 权重配置对象
     */
    setWeights(weights) {
        this.weights = { ...this.weights, ...weights };
    }

    /**
     * 获取权重配置
     * @returns {Object}
     */
    getWeights() {
        return { ...this.weights };
    }
}


