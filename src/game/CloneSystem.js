/**
 * 分身系统
 * 管理角色的分身
 */
import { Pathfinding } from '../physics/Pathfinding.js';

export class CloneSystem {
    constructor(scene, combatSystem, levelManager, modelManager = null, collisionDetector = null) {
        this.scene = scene;
        this.combatSystem = combatSystem;
        this.levelManager = levelManager;
        this.modelManager = modelManager; // 模型管理器
        this.collisionDetector = collisionDetector; // 碰撞检测器
        this.pathfinding = collisionDetector ? new Pathfinding(collisionDetector) : null; // 寻路系统
        this.clones = []; // 分身列表
    }

    /**
     * 创建分身
     * @param {THREE.Vector3} position 位置
     * @param {number} health 血量
     * @param {number} attack 攻击力
     * @param {number} duration 持续时间（毫秒）
     * @param {THREE.Vector3} characterPosition 角色位置（用于追踪）
     * @returns {Promise<Clone>} 创建的分身对象
     */
    async createClone(position, health, attack, duration, characterPosition) {
        const clone = new Clone(position, health, attack, duration, characterPosition, this.modelManager, this.pathfinding);
        await clone.createModel(); // 等待模型创建完成

        this.clones.push(clone);

        // 将分身模型添加到场景
        if (clone.group && this.scene) {
            this.scene.add(clone.group);
        }

        console.log(`创建分身，位置: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);
        return clone;
    }

    /**
     * 更新所有分身
     * @param {THREE.Vector3} characterPosition 角色位置
     * @param {THREE.Vector3} characterDirection 角色方向
     * @param {CollisionDetector} collisionDetector 碰撞检测器
     * @param {Function} createDamageNumber 创建伤害数字的函数
     * @param {Array} damageNumbers 伤害数字数组
     */
    update(characterPosition, characterDirection, collisionDetector, createDamageNumber, damageNumbers) {
        // 更新寻路系统（如果碰撞检测器改变）
        if (collisionDetector && (!this.pathfinding || this.pathfinding.collisionDetector !== collisionDetector)) {
            this.pathfinding = new Pathfinding(collisionDetector);
            // 更新所有分身的寻路系统
            for (const clone of this.clones) {
                clone.pathfinding = this.pathfinding;
            }
        }
        const currentTime = Date.now();

        // 更新所有分身
        for (let i = this.clones.length - 1; i >= 0; i--) {
            const clone = this.clones[i];

            // 检查是否过期
            if (currentTime - clone.createTime >= clone.duration) {
                // 分身消失（逐渐淡出）
                const elapsed = currentTime - clone.createTime;
                const fadeStart = clone.duration - 2000; // 最后2秒开始淡出

                if (elapsed >= fadeStart) {
                    const fadeProgress = (elapsed - fadeStart) / 2000;
                    if (clone.group) {
                        clone.group.traverse((object) => {
                            if (object.material) {
                                if (Array.isArray(object.material)) {
                                    object.material.forEach(mat => {
                                        if (mat.opacity !== undefined) {
                                            mat.opacity = 1 - fadeProgress;
                                            mat.transparent = true;
                                        }
                                    });
                                } else {
                                    if (object.material.opacity !== undefined) {
                                        object.material.opacity = 1 - fadeProgress;
                                        object.material.transparent = true;
                                    }
                                }
                            }
                        });
                    }
                }

                // 完全消失后移除
                if (elapsed >= clone.duration) {
                    this.removeClone(i);
                    continue;
                }
            }

            // 更新分身（移动、攻击等）- 传递levelManager用于寻找小怪
            clone.update(characterPosition, collisionDetector, this.levelManager);

            // 分身可以攻击（使用龙虎拳）- 分身攻击目标怪物
            if (clone.canAttack && clone.targetMonster && clone.targetMonster.isAlive) {
                // 朝目标怪物方向攻击
                const targetPos = clone.targetMonster.getPosition();
                const attackDirection = targetPos.clone().sub(clone.position).normalize();

                clone.performAttack(
                    attackDirection,
                    this.combatSystem,
                    this.levelManager,
                    this.scene,
                    createDamageNumber,
                    damageNumbers
                );
                clone.canAttack = false;
            }
        }
    }

    /**
     * 移除分身
     * @param {number} index 分身索引
     */
    removeClone(index) {
        const clone = this.clones[index];
        if (clone && clone.group && this.scene) {
            this.scene.remove(clone.group);
            clone.dispose();
        }
        this.clones.splice(index, 1);
    }

    /**
     * 清理所有分身
     */
    clear() {
        for (let i = this.clones.length - 1; i >= 0; i--) {
            this.removeClone(i);
        }
    }

    /**
     * 获取所有活着的分身
     * @returns {Array<Clone>}
     */
    getAliveClones() {
        return this.clones.filter(clone => clone.isAlive);
    }
}

/**
 * 分身类
 */
class Clone {
    constructor(position, health, attack, duration, characterPosition, modelManager = null, pathfinding = null) {
        this.position = position.clone();
        this.maxHealth = health;
        this.currentHealth = health;
        this.attack = attack;
        this.duration = duration;
        this.createTime = Date.now();
        this.isAlive = true;
        this.group = null;
        this.canAttack = false;
        this.lastAttackTime = 0;
        this.attackCooldown = 1000; // 1秒攻击冷却
        this.modelManager = modelManager; // 模型管理器
        this.pathfinding = pathfinding; // 寻路系统

        // 目标怪物（优先Boss，然后是小怪）
        this.targetMonster = null;
        this.targetPosition = characterPosition ? characterPosition.clone() : position.clone();
        this.searchRange = 50; // 搜索范围（增大范围以便找到所有怪物）

        // 寻路相关
        this.path = []; // 当前路径
        this.currentPathIndex = 0; // 当前路径点索引
        this.pathUpdateInterval = 1000; // 路径更新间隔（毫秒）
        this.lastPathUpdate = 0; // 上次路径更新时间
        this.usePathfinding = true; // 是否使用寻路系统
    }

    /**
     * 创建分身模型（使用GLB模型或默认模型）
     */
    async createModel() {
        // 如果模型管理器存在，尝试加载GLB模型
        if (this.modelManager) {
            try {
                // 尝试加载角色模型
                const model = await this.modelManager.getModel('character_default');
                this.group = model;
                this.group.position.copy(this.position);

                // 设置半透明效果
                this.group.traverse((object) => {
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(mat => {
                                if (mat) {
                                    mat.transparent = true;
                                    mat.opacity = 0.6;
                                }
                            });
                        } else {
                            if (object.material) {
                                object.material.transparent = true;
                                object.material.opacity = 0.6;
                            }
                        }
                    }
                });

                // 初始方向与相机控制器一致（0度）
                this.group.rotation.set(0, 0, 0);

                return;
            } catch (error) {
                console.warn('加载分身GLB模型失败，使用默认模型:', error);
            }
        }

        // 使用默认的简单几何体模型（半透明）
        const cloneGroup = new THREE.Group();

        // 身体（圆柱体，半透明）
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.8, 16);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0xffb6c1,
            transparent: true,
            opacity: 0.6
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.4;
        cloneGroup.add(body);

        // 头部（球体，半透明）
        const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const headMaterial = new THREE.MeshPhongMaterial({
            color: 0xffdbac,
            transparent: true,
            opacity: 0.6
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.1;
        cloneGroup.add(head);

        this.group = cloneGroup;
        this.group.position.copy(this.position);
        // 初始方向与相机控制器一致（0度）
        this.group.rotation.set(0, 0, 0);
    }

    /**
     * 更新分身
     * @param {THREE.Vector3} characterPosition 角色位置
     * @param {CollisionDetector} collisionDetector 碰撞检测器
     * @param {LevelManager} levelManager 关卡管理器（用于寻找怪物）
     */
    update(characterPosition, collisionDetector, levelManager = null) {
        if (!this.isAlive || !this.group) return;

        // 检查当前目标是否还活着
        if (this.targetMonster && (!this.targetMonster.isAlive || this.targetMonster.currentHealth <= 0)) {
            // 目标已死亡，清除目标
            this.targetMonster = null;
            this.path = []; // 清除路径
            this.currentPathIndex = 0;
        }

        // 如果没有目标或目标已死亡，寻找新目标
        if (!this.targetMonster && levelManager) {
            this.targetMonster = this.findTarget(levelManager);
            if (this.targetMonster) {
                this.path = []; // 新目标，清除旧路径
                this.currentPathIndex = 0;
            }
        }

        // 如果有目标怪物，追踪目标；否则追踪角色
        const newTargetPosition = (this.targetMonster && this.targetMonster.isAlive)
            ? this.targetMonster.getPosition().clone()
            : (characterPosition ? characterPosition.clone() : this.targetPosition.clone());

        // 如果目标位置改变，更新路径
        const currentTime = Date.now();
        const targetChanged = !this.targetPosition.equals(newTargetPosition);
        if (targetChanged) {
            this.targetPosition = newTargetPosition;
            this.path = []; // 目标改变，清除路径
            this.currentPathIndex = 0;
        }

        // 使用寻路系统移动
        if (this.usePathfinding && this.pathfinding && collisionDetector) {
            // 如果路径为空或需要更新，计算新路径
            if (this.path.length === 0 ||
                (currentTime - this.lastPathUpdate > this.pathUpdateInterval && targetChanged)) {
                this.path = this.pathfinding.findPath(this.position, this.targetPosition);
                this.currentPathIndex = 0;
                this.lastPathUpdate = currentTime;
            }

            // 沿着路径移动
            if (this.path.length > 0 && this.currentPathIndex < this.path.length) {
                const nextWaypoint = this.path[this.currentPathIndex];
                const direction = nextWaypoint.clone().sub(this.position);
                const distance = direction.length();

                if (distance < 0.3) {
                    // 到达路径点，移动到下一个
                    this.currentPathIndex++;
                    if (this.currentPathIndex >= this.path.length) {
                        // 到达终点
                        this.path = [];
                        this.currentPathIndex = 0;
                    }
                } else {
                    // 朝向下一个路径点移动
                    direction.normalize();
                    const moveDistance = 0.03; // 移动速度
                    const newPosition = this.position.clone().add(direction.multiplyScalar(moveDistance));

                    // 检查碰撞
                    if (collisionDetector.isValidPosition(newPosition, 0.6)) {
                        this.setPosition(newPosition);
                    }

                    // 面向移动方向
                    if (direction.length() > 0.01 && this.group) {
                        const angle = Math.atan2(direction.x, direction.z);
                        this.group.rotation.y = angle;
                    }
                }
            } else {
                // 没有路径，使用直线移动（备用方案）
                const direction = this.targetPosition.clone().sub(this.position);
                const distance = direction.length();

                if (distance > 0.1) {
                    direction.normalize();
                    const moveDistance = 0.03;
                    const newPosition = this.position.clone().add(direction.multiplyScalar(moveDistance));

                    if (collisionDetector.isValidPosition(newPosition, 0.6)) {
                        this.setPosition(newPosition);
                    }

                    if (direction.length() > 0.01 && this.group) {
                        const angle = Math.atan2(direction.x, direction.z);
                        this.group.rotation.y = angle;
                    }
                }
            }
        } else {
            // 不使用寻路系统，直接移动（原有逻辑）
            const direction = this.targetPosition.clone().sub(this.position);
            const distance = direction.length();

            if (distance > 0.1) {
                direction.normalize();
                const moveDistance = 0.03;
                const newPosition = this.position.clone().add(direction.multiplyScalar(moveDistance));

                if (collisionDetector && collisionDetector.isValidPosition(newPosition, 0.6)) {
                    this.setPosition(newPosition);
                }

                if (direction.length() > 0.01 && this.group) {
                    const angle = Math.atan2(direction.x, direction.z);
                    this.group.rotation.y = angle;
                }
            }
        }

        // 更新攻击冷却
        if (currentTime - this.lastAttackTime >= this.attackCooldown) {
            this.canAttack = true;
        }
    }

    /**
     * 寻找目标怪物（优先Boss，然后是小怪）
     * @param {LevelManager} levelManager 关卡管理器
     * @returns {Monster|null} 目标怪物
     */
    findTarget(levelManager) {
        let targetMonster = null;
        let minDistance = Infinity;

        // 优先寻找Boss（包括主Boss和小Boss）
        const bosses = [];
        if (levelManager.boss && levelManager.boss.isAlive) {
            bosses.push(levelManager.boss);
        }
        bosses.push(...levelManager.miniBosses.filter(b => b.isAlive));

        // 先找Boss
        for (const boss of bosses) {
            const bossPos = boss.getPosition();
            const distance = this.position.distanceTo(bossPos);

            if (distance < this.searchRange && distance < minDistance) {
                minDistance = distance;
                targetMonster = boss;
            }
        }

        // 如果没有找到Boss，找普通怪物
        if (!targetMonster) {
            const monsters = levelManager.monsters.filter(m => m.isAlive && !m.isBoss);

            for (const monster of monsters) {
                const monsterPos = monster.getPosition();
                const distance = this.position.distanceTo(monsterPos);

                if (distance < this.searchRange && distance < minDistance) {
                    minDistance = distance;
                    targetMonster = monster;
                }
            }
        }

        return targetMonster;
    }

    /**
     * 执行攻击（龙虎拳）- 分身可以攻击所有怪物，优先攻击目标
     * @param {THREE.Vector3} direction 攻击方向
     * @param {CombatSystem} combatSystem 战斗系统
     * @param {LevelManager} levelManager 关卡管理器
     * @param {THREE.Scene} scene 场景
     * @param {Function} createDamageNumber 创建伤害数字的函数
     * @param {Array} damageNumbers 伤害数字数组
     */
    performAttack(direction, combatSystem, levelManager, scene, createDamageNumber, damageNumbers) {
        const currentTime = Date.now();
        if (currentTime - this.lastAttackTime < this.attackCooldown) {
            return;
        }

        // 如果没有目标，不攻击
        if (!this.targetMonster || !this.targetMonster.isAlive) {
            return;
        }

        this.lastAttackTime = currentTime;
        this.canAttack = false;

        // 分身攻击伤害
        const damage = 10;
        const range = 10;
        const attackerPosition = this.position;
        const targetPos = this.targetMonster.getPosition();
        const toTarget = targetPos.clone().sub(attackerPosition);
        const distance = toTarget.length();

        // 检查目标是否在攻击范围内
        if (distance > range) {
            return;
        }

        // 检查方向（前方180度）
        toTarget.normalize();
        direction.normalize();
        const dot = direction.dot(toTarget);
        const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

        // 如果角度在90度以内（前方180度范围），攻击目标
        if (angle <= Math.PI / 2) {
            const options = this.targetMonster.isBoss ? {
                scene: scene,
                character: null, // 分身不是角色
                physicsEngine: null,
                createMiniBossCallback: (position, levelNum, sceneParam) => {
                    // 从main.js获取createMiniBoss方法
                    if (window.game && window.game.createMiniBoss) {
                        return window.game.createMiniBoss(position, levelNum, sceneParam || scene);
                    }
                    return Promise.resolve();
                },
                dropLootCallback: (levelNum) => {
                    // 从main.js获取dropBossLoot方法
                    if (window.game && window.game.dropBossLoot) {
                        window.game.dropBossLoot(levelNum);
                    }
                }
            } : {};

            const isDead = this.targetMonster.takeDamage(damage, options);

            // 显示伤害数字
            if (scene && createDamageNumber) {
                const damageNum = createDamageNumber(scene, targetPos, damage, false, true);
                if (damageNumbers) {
                    damageNumbers.push(damageNum);
                }
            }

            // 如果目标死亡，清除目标，让update方法重新寻找
            if (isDead) {
                this.targetMonster = null;
                console.log(`分身击败了目标怪物`);
            }
        }
    }

    /**
     * 受到伤害
     * @param {number} damage 伤害值
     * @returns {boolean} 是否死亡
     */
    takeDamage(damage) {
        if (!this.isAlive) return false;

        this.currentHealth = Math.max(0, this.currentHealth - damage);

        if (this.currentHealth <= 0) {
            this.currentHealth = 0;
            this.isAlive = false;
            return true;
        }

        return false;
    }

    /**
     * 设置位置
     * @param {THREE.Vector3} position 位置
     */
    setPosition(position) {
        this.position.copy(position);
        if (this.group) {
            this.group.position.copy(position);
        }
    }

    /**
     * 获取位置
     * @returns {THREE.Vector3}
     */
    getPosition() {
        return this.position.clone();
    }

    /**
     * 清理资源
     */
    dispose() {
        if (this.group) {
            this.group.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            this.group = null;
        }
    }
}

