/**
 * 仇恨系统
 * 管理怪物对玩家的仇恨和追踪
 */
export class AggroSystem {
    constructor() {
        this.aggroRange = 8; // 仇恨范围（距离）
        this.attackRange = 2; // 攻击范围
        this.attackCooldown = 2000; // 攻击冷却时间（毫秒）
    }

    /**
     * 检查是否在仇恨范围内
     * @param {THREE.Vector3} monsterPosition 怪物位置
     * @param {THREE.Vector3} characterPosition 角色位置
     * @returns {boolean}
     */
    isInAggroRange(monsterPosition, characterPosition) {
        const distance = monsterPosition.distanceTo(characterPosition);
        return distance <= this.aggroRange;
    }

    /**
     * 检查是否在攻击范围内
     * @param {THREE.Vector3} monsterPosition 怪物位置
     * @param {THREE.Vector3} characterPosition 角色位置
     * @returns {boolean}
     */
    isInAttackRange(monsterPosition, characterPosition) {
        const distance = monsterPosition.distanceTo(characterPosition);
        return distance <= this.attackRange;
    }

    /**
     * 计算朝向角色的方向
     * @param {THREE.Vector3} monsterPosition 怪物位置
     * @param {THREE.Vector3} characterPosition 角色位置
     * @returns {THREE.Vector3} 归一化的方向向量
     */
    getDirectionToCharacter(monsterPosition, characterPosition) {
        const direction = characterPosition.clone().sub(monsterPosition);
        direction.y = 0; // 只考虑水平方向
        return direction.normalize();
    }

    /**
     * 设置仇恨范围
     */
    setAggroRange(range) {
        this.aggroRange = range;
    }

    /**
     * 设置攻击范围
     */
    setAttackRange(range) {
        this.attackRange = range;
    }

    /**
     * 设置攻击冷却时间
     */
    setAttackCooldown(cooldown) {
        this.attackCooldown = cooldown;
    }
}


