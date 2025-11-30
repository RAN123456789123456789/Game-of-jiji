/**
 * 技能系统
 * 管理角色的技能（分身、龙虎拳等）
 */
export class SkillSystem {
    constructor(character, scene, combatSystem, levelManager) {
        this.character = character;
        this.scene = scene;
        this.combatSystem = combatSystem;
        this.levelManager = levelManager;

        // 技能冷却时间（毫秒）
        this.cooldowns = {
            clone: 0,      // 分身技能冷却
            dragonTiger: 0 // 龙虎拳冷却
        };

        // 技能配置
        this.skillConfig = {
            clone: {
                cooldown: 30000,  // 30秒冷却
                duration: 20000,  // 20秒持续时间
                count: 5,         // 分身数量
                health: 100,      // 分身血量（固定100）
                attackPercent: 1.0  // 100%攻击力
            },
            dragonTiger: {
                cooldown: 5000,   // 5秒冷却
                damage: 1000,     // 1000伤害
                range: 10         // 攻击范围
            }
        };

        // 当前时间
        this.currentTime = Date.now();
        this.lastUpdateTime = this.currentTime;
    }

    /**
     * 更新技能系统（更新冷却时间）
     */
    update() {
        const now = Date.now();
        const deltaTime = now - this.lastUpdateTime;

        // 更新所有技能的冷却时间
        for (const skill in this.cooldowns) {
            if (this.cooldowns[skill] > 0) {
                this.cooldowns[skill] = Math.max(0, this.cooldowns[skill] - deltaTime);
            }
        }

        this.lastUpdateTime = now;
    }

    /**
     * 使用分身技能
     * @param {Function} createCloneCallback 创建分身的回调函数（可以是异步的）
     * @returns {boolean} 是否成功使用
     */
    async useCloneSkill(createCloneCallback) {
        if (!this.canUseSkill('clone')) {
            return false;
        }

        const config = this.skillConfig.clone;
        const characterPos = this.character.getPosition();
        const characterStats = this.character.getCombatStats();

        // 创建5个分身
        const clonePromises = [];
        for (let i = 0; i < config.count; i++) {
            // 在角色周围生成分身
            const angle = (i / config.count) * Math.PI * 2;
            const distance = 2; // 距离角色2个单位
            const clonePosition = characterPos.clone().add(
                new THREE.Vector3(
                    Math.cos(angle) * distance,
                    0,
                    Math.sin(angle) * distance
                )
            );

            // 计算分身属性
            const cloneHealth = config.health || 100; // 固定100血量
            const cloneAttack = characterStats.attack || 0; // 100%攻击力（但实际攻击伤害是10）

            // 调用回调函数创建分身（支持异步）
            if (createCloneCallback) {
                const promise = createCloneCallback(clonePosition, cloneHealth, cloneAttack, config.duration);
                clonePromises.push(promise);
            }
        }

        // 等待所有分身创建完成
        await Promise.all(clonePromises);

        // 设置冷却时间（毫秒）
        this.cooldowns.clone = this.skillConfig.clone.cooldown;
        this.lastUpdateTime = Date.now();

        console.log(`使用分身技能，创建${config.count}个分身`);
        return true;
    }

    /**
     * 使用龙虎拳技能
     * @param {THREE.Vector3} direction 攻击方向
     * @param {Function} createDamageNumber 创建伤害数字的函数
     * @param {Array} damageNumbers 伤害数字数组
     * @param {Function} createMiniBossCallback 创建小boss的回调函数（可选）
     * @param {Function} dropLootCallback 掉落物品的回调函数（可选）
     * @returns {boolean} 是否成功使用
     */
    useDragonTigerSkill(direction, createDamageNumber, damageNumbers, createMiniBossCallback = null, dropLootCallback = null) {
        if (!this.canUseSkill('dragonTiger')) {
            return false;
        }

        const config = this.skillConfig.dragonTiger;
        const attackerPosition = this.character.getPosition();

        // 获取所有活着的怪物（包括Boss）
        const monsters = this.levelManager.getAliveMonsters();
        const hitMonsters = [];

        // 检查范围内的怪物
        for (const monster of monsters) {
            const monsterPos = monster.getPosition();
            const toMonster = monsterPos.clone().sub(attackerPosition);
            const distance = toMonster.length();

            // 检查距离
            if (distance > config.range) continue;

            // 检查方向（前方180度）
            toMonster.normalize();
            direction.normalize();
            const dot = direction.dot(toMonster);
            const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

            // 如果角度在90度以内（前方180度范围）
            if (angle <= Math.PI / 2) {
                hitMonsters.push(monster);
            }
        }

        // 对击中的怪物造成伤害
        for (const monster of hitMonsters) {
            let actualDamage = config.damage;

            // 对Boss的伤害限制：如果Boss血量在50%以上，只造成刚好触发无敌帧的伤害
            if (monster.isBoss && !monster.isMiniBoss) {
                const healthPercent = monster.currentHealth / monster.maxHealth;

                // 如果Boss血量在50%以上，限制伤害，只触发无敌帧
                if (healthPercent > 0.5) {
                    // 计算刚好触发50%血量的伤害
                    const targetHealth = monster.maxHealth * 0.5;
                    actualDamage = Math.min(config.damage, monster.currentHealth - targetHealth);

                    // 确保至少造成1点伤害
                    if (actualDamage <= 0) {
                        actualDamage = 1;
                    }
                }
                // 如果Boss血量在50%以下（无敌帧结束后），可以正常造成伤害
            }

            const options = monster.isBoss ? {
                scene: this.scene,
                character: this.character,
                physicsEngine: null,
                createMiniBossCallback: createMiniBossCallback,
                dropLootCallback: dropLootCallback
            } : { character: this.character };

            const isDead = monster.takeDamage(actualDamage, options);

            // 显示伤害数字
            if (this.scene && createDamageNumber) {
                const damageNum = createDamageNumber(this.scene, monster.getPosition(), actualDamage, false, true);
                if (damageNumbers) {
                    damageNumbers.push(damageNum);
                }
            }

            if (isDead) {
                console.log(`龙虎拳击败了 ${monster.id}`);
            }
        }

        // 设置冷却时间（毫秒）
        this.cooldowns.dragonTiger = this.skillConfig.dragonTiger.cooldown;
        this.lastUpdateTime = Date.now();

        console.log(`使用龙虎拳，对${hitMonsters.length}个目标造成${config.damage}点伤害`);
        return true;
    }

    /**
     * 检查技能是否可以使用
     * @param {string} skillName 技能名称
     * @returns {boolean}
     */
    canUseSkill(skillName) {
        return this.cooldowns[skillName] <= 0;
    }

    /**
     * 获取技能冷却时间（秒）
     * @param {string} skillName 技能名称
     * @returns {number}
     */
    getCooldown(skillName) {
        return Math.ceil(this.cooldowns[skillName] / 1000);
    }

    /**
     * 获取技能配置
     * @param {string} skillName 技能名称
     * @returns {Object}
     */
    getSkillConfig(skillName) {
        return this.skillConfig[skillName] || null;
    }

    /**
     * 设置技能配置
     * @param {string} skillName 技能名称
     * @param {Object} config 配置对象
     */
    setSkillConfig(skillName, config) {
        if (this.skillConfig[skillName]) {
            this.skillConfig[skillName] = { ...this.skillConfig[skillName], ...config };
        }
    }
}

