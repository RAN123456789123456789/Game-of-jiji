/**
 * 战斗系统
 * 处理攻击逻辑
 */
export class CombatSystem {
    constructor() {
        this.baseAttackDamage = 20; // 基础攻击伤害
        this.attackRange = 5; // 攻击范围（距离）
        this.attackAngle = Math.PI; // 攻击角度（180度）
    }

    /**
     * 执行攻击
     * @param {THREE.Vector3} attackerPosition - 攻击者位置
     * @param {THREE.Vector3} attackerDirection - 攻击者朝向
     * @param {Array<Monster>} monsters - 所有怪兽列表
     * @returns {Array<Monster>} 被击中的怪兽列表
     */
    attack(attackerPosition, attackerDirection, monsters) {
        const hitMonsters = [];
        const direction = attackerDirection.clone().normalize();

        for (const monster of monsters) {
            if (!monster.isAlive) continue;

            const monsterPos = monster.getPosition();
            const toMonster = monsterPos.clone().sub(attackerPosition);
            const distance = toMonster.length();

            // 检查距离
            if (distance > this.attackRange) continue;

            // 检查角度（前方180度）
            toMonster.normalize();
            const dot = direction.dot(toMonster);
            const angle = Math.acos(dot);

            // 如果角度在90度以内（前方180度范围）
            if (angle <= this.attackAngle / 2) {
                hitMonsters.push(monster);
            }
        }

        return hitMonsters;
    }

    /**
     * 对怪兽造成伤害
     * @param {Monster} monster 
     * @param {Object} options 额外选项（包括character用于吸血和装备属性）
     * @returns {boolean} 是否死亡
     */
    damageMonster(monster, options = {}) {
        const character = options.character;
        if (!character) {
            // 如果没有角色，使用基础伤害
            return monster.takeDamage(this.baseAttackDamage, options);
        }

        // 获取角色属性（包括装备加成）
        const stats = character.getCombatStats();

        // 计算实际伤害
        let damage = this.baseAttackDamage + (stats.attack || 0);

        // 计算暴击
        const isCrit = this.checkCrit(stats.critRate || 0);
        if (isCrit) {
            damage = damage * 2; // 暴击伤害为攻击力的两倍
        }

        // 对怪物造成伤害（确保options被正确传递）
        const isDead = monster.takeDamage(damage, options);

        // 吸血效果：根据吸血属性回复血量
        if (character && character.isAlive && stats.lifesteal > 0) {
            const healAmount = stats.lifesteal; // 一点吸血等于一点回血
            character.heal(healAmount);
        }

        // 返回伤害信息（用于显示）
        return { isDead, damage, isCrit };
    }

    /**
     * 检查是否暴击
     * @param {number} critRate 暴击率（百分比）
     * @returns {boolean}
     */
    checkCrit(critRate) {
        if (critRate <= 0) return false;
        const random = Math.random() * 100;
        return random < critRate;
    }

    /**
     * 设置基础攻击伤害
     */
    setBaseAttackDamage(damage) {
        this.baseAttackDamage = damage;
    }

    /**
     * 获取基础攻击伤害
     */
    getBaseAttackDamage() {
        return this.baseAttackDamage;
    }

    /**
     * 设置攻击范围
     */
    setAttackRange(range) {
        this.attackRange = range;
    }

    /**
     * 设置攻击角度（弧度）
     */
    setAttackAngle(angle) {
        this.attackAngle = angle;
    }
}


