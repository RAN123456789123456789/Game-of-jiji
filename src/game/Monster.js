/**
 * 小怪兽类
 */
import { AggroSystem } from './AggroSystem.js';

export class Monster {
    constructor(id, position, modelManager = null) {
        this.id = id;
        this.position = position;
        this.modelManager = modelManager;
        this.group = null;
        this.maxHealth = 100;
        this.currentHealth = 100;
        this.isAlive = true;
        this.mesh = null;
        this.healthBar = null;
        this.moveSpeed = 0.025; // 移动速度（玩家速度的一半，玩家是0.05）
        this.targetPosition = null; // 目标位置
        this.wanderRadius = 10; // 游荡半径
        this.wanderCenter = position.clone(); // 游荡中心
        this.lastWanderTime = Date.now();
        this.wanderInterval = 3000; // 每3秒改变一次目标

        // 仇恨系统
        this.aggroSystem = new AggroSystem();
        this.hasAggro = false; // 是否有仇恨
        this.characterTarget = null; // 仇恨目标（角色）
        this.attackDamage = 3; // 攻击伤害
        this.lastAttackTime = 0; // 上次攻击时间
    }

    /**
     * 创建怪兽模型
     * @returns {THREE.Group}
     */
    async createModel() {
        // 如果模型管理器存在且注册了怪兽模型，则加载
        if (this.modelManager) {
            try {
                const model = await this.modelManager.getModel('monster_default');
                this.group = model;
                this.group.position.copy(this.position);
                return this.group;
            } catch (error) {
                console.warn('加载怪兽模型失败，使用默认模型:', error);
            }
        }

        // 使用默认的简单几何体模型
        return this.createDefaultModel();
    }

    /**
     * 创建默认怪兽模型（简易几何体）
     */
    createDefaultModel() {
        const monsterGroup = new THREE.Group();

        // 身体（立方体，红色）
        const bodyGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.6);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.4;
        monsterGroup.add(body);
        this.mesh = body;

        // 头部（球体，深红色）
        const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0xcc0000 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 0.9;
        monsterGroup.add(head);

        // 眼睛（黑色小球）
        const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.1, 0.95, 0.25);
        monsterGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.1, 0.95, 0.25);
        monsterGroup.add(rightEye);

        // 腿部
        const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.4, 8);
        const legMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.2, -0.2, 0);
        monsterGroup.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.2, -0.2, 0);
        monsterGroup.add(rightLeg);

        // 手臂
        const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8);
        const leftArm = new THREE.Mesh(armGeometry, legMaterial);
        leftArm.position.set(-0.35, 0.3, 0);
        leftArm.rotation.z = Math.PI / 6;
        monsterGroup.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, legMaterial);
        rightArm.position.set(0.35, 0.3, 0);
        rightArm.rotation.z = -Math.PI / 6;
        monsterGroup.add(rightArm);

        // 创建血量条
        this.createHealthBar(monsterGroup);

        this.group = monsterGroup;
        this.group.position.copy(this.position);

        return monsterGroup;
    }

    /**
     * 创建血量条
     */
    createHealthBar(group) {
        const healthBarGroup = new THREE.Group();

        // 背景条（灰色）
        const bgGeometry = new THREE.PlaneGeometry(0.8, 0.1);
        const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const bg = new THREE.Mesh(bgGeometry, bgMaterial);
        bg.position.y = 1.2;
        healthBarGroup.add(bg);

        // 血量条（绿色）
        const healthGeometry = new THREE.PlaneGeometry(0.76, 0.08);
        const healthMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
        healthBar.position.set(0, 1.2, 0.01);
        healthBarGroup.add(healthBar);

        this.healthBar = healthBar;
        this.healthBarGroup = healthBarGroup;
        group.add(healthBarGroup);
    }

    /**
     * 更新血量条
     */
    updateHealthBar() {
        if (!this.healthBar) return;

        const healthPercent = this.currentHealth / this.maxHealth;
        this.healthBar.scale.x = healthPercent;

        // 根据血量改变颜色
        if (healthPercent > 0.6) {
            this.healthBar.material.color.setHex(0x00ff00); // 绿色
        } else if (healthPercent > 0.3) {
            this.healthBar.material.color.setHex(0xffff00); // 黄色
        } else {
            this.healthBar.material.color.setHex(0xff0000); // 红色
        }
    }

    /**
     * 受到伤害
     * @param {number} damage 
     * @param {Object} options 额外选项（如scene用于Boss死亡时创建宝藏）
     */
    takeDamage(damage, options = {}) {
        if (!this.isAlive) return false;

        this.currentHealth = Math.max(0, this.currentHealth - damage);
        this.updateHealthBar();

        if (this.currentHealth <= 0) {
            // 如果子类重写了die方法，调用时会传递参数
            if (this.die.length > 0) {
                // 传递所有选项（包括scene和createMiniBossCallback）
                // 如果是异步的die方法，需要等待完成
                console.log(`Monster死亡，调用die方法，scene: ${!!options.scene}, callback: ${!!options.createMiniBossCallback}`);
                const dieResult = this.die(options.scene, options.createMiniBossCallback, options.dropLootCallback);
                // 如果是Promise，不等待（避免阻塞），但记录错误和成功
                if (dieResult && typeof dieResult.then === 'function') {
                    dieResult.then(() => {
                        console.log('Boss死亡处理完成（异步）');
                    }).catch(error => {
                        console.error('Boss死亡处理错误:', error);
                        console.error('错误堆栈:', error.stack);
                    });
                }
            } else {
                this.die();
            }
            return true; // 返回true表示已死亡
        }

        return false; // 返回false表示还活着
    }

    /**
     * 死亡
     * @param {THREE.Scene} scene 场景对象（可选，Boss会使用）
     */
    die(scene = null) {
        this.isAlive = false;
        this.currentHealth = 0;
        if (this.group) {
            this.group.visible = false;
        }
    }

    /**
     * 获取位置
     */
    getPosition() {
        return this.position.clone();
    }

    /**
     * 设置位置
     */
    setPosition(position) {
        this.position.copy(position);
        if (this.group) {
            this.group.position.copy(position);
        }
    }

    /**
     * 更新怪物移动和仇恨
     * @param {THREE.Vector3} characterPosition 角色位置（用于追踪）
     * @param {CollisionDetector} collisionDetector 碰撞检测器
     * @param {Character} character 角色对象（用于攻击）
     * @param {THREE.Scene} scene 场景（用于显示伤害数字）
     * @param {Array} damageNumbers 伤害数字数组
     * @param {Function} createDamageNumber 创建伤害数字的函数
     * @param {CloneSystem} cloneSystem 分身系统（可选，用于攻击分身）
     * @returns {boolean} 是否攻击了角色或分身
     */
    update(characterPosition, collisionDetector, character = null, scene = null, damageNumbers = [], createDamageNumber = null, cloneSystem = null) {
        if (!this.isAlive || !this.group) return false;

        const currentTime = Date.now();
        let attacked = false;

        // 优先寻找附近的分身
        let targetClone = null;
        let cloneDistance = Infinity;
        if (cloneSystem) {
            const clones = cloneSystem.getAliveClones();
            for (const clone of clones) {
                const distance = this.position.distanceTo(clone.position);
                if (distance < 15 && distance < cloneDistance) {
                    cloneDistance = distance;
                    targetClone = clone;
                }
            }
        }

        // 检查仇恨范围（角色或分身）
        const targetPosition = targetClone ? targetClone.position : characterPosition;
        const inAggroRange = this.aggroSystem.isInAggroRange(this.position, targetPosition);

        if (inAggroRange && (targetClone || character)) {
            this.hasAggro = true;
            this.characterTarget = targetClone || character;

            // 检查攻击范围
            const inAttackRange = this.aggroSystem.isInAttackRange(this.position, targetPosition);

            // 始终面向目标（即使不能移动或正在攻击）
            const direction = this.aggroSystem.getDirectionToCharacter(this.position, targetPosition);
            if (direction.length() > 0.01 && this.group) {
                const angle = Math.atan2(direction.x, direction.z);
                this.group.rotation.y = angle;
            }

            if (inAttackRange) {
                // 在攻击范围内，尝试攻击
                if (currentTime - this.lastAttackTime >= this.aggroSystem.attackCooldown) {
                    if (targetClone) {
                        // 攻击分身
                        attacked = this.attackClone(targetClone, scene, damageNumbers, createDamageNumber);
                    } else if (character) {
                        // 攻击角色
                        attacked = this.attackCharacter(character, scene, damageNumbers, createDamageNumber);
                    }
                    this.lastAttackTime = currentTime;
                }
            } else {
                // 不在攻击范围，追踪目标
                this.moveTowards(direction, collisionDetector);
            }
        } else {
            // 不在仇恨范围，正常游荡
            this.hasAggro = false;
            this.characterTarget = null;

            // 每3秒重新选择目标位置
            if (!this.targetPosition || (currentTime - this.lastWanderTime) > this.wanderInterval) {
                this.chooseNewTarget();
                this.lastWanderTime = currentTime;
            }

            // 移动到目标位置
            if (this.targetPosition) {
                const direction = this.targetPosition.clone().sub(this.position);
                const distance = direction.length();

                if (distance > 0.1) {
                    direction.normalize();
                    this.moveTowards(direction, collisionDetector);
                } else {
                    // 到达目标，选择新目标
                    this.chooseNewTarget();
                }
            }
        }

        return attacked;
    }

    /**
     * 朝指定方向移动
     */
    moveTowards(direction, collisionDetector) {
        const moveDistance = this.moveSpeed;
        const newPosition = this.position.clone().add(direction.multiplyScalar(moveDistance));

        // 检查碰撞
        if (collisionDetector && collisionDetector.isValidPosition(newPosition, 0.6)) {
            this.setPosition(newPosition);
        }

        // 无论是否移动成功，都面向目标方向
        if (direction.length() > 0.01 && this.group) {
            const angle = Math.atan2(direction.x, direction.z);
            this.group.rotation.y = angle;
        }
    }

    /**
     * 攻击角色
     * @param {Character} character 角色对象
     * @param {THREE.Scene} scene 场景
     * @param {Array} damageNumbers 伤害数字数组
     * @param {Function} createDamageNumber 创建伤害数字的函数
     * @returns {boolean} 是否成功攻击
     */
    attackCharacter(character, scene, damageNumbers, createDamageNumber) {
        if (!character || !character.isAlive) return false;

        // 造成伤害
        const isDead = character.takeDamage(this.attackDamage);

        // 显示伤害数字
        if (scene && damageNumbers && createDamageNumber) {
            const damageNum = createDamageNumber(scene, character.getPosition(), this.attackDamage, false);
            damageNumbers.push(damageNum);
        }

        return true;
    }

    /**
     * 攻击分身
     * @param {Clone} clone 分身对象
     * @param {THREE.Scene} scene 场景
     * @param {Array} damageNumbers 伤害数字数组
     * @param {Function} createDamageNumber 创建伤害数字的函数
     * @returns {boolean} 是否成功攻击
     */
    attackClone(clone, scene, damageNumbers, createDamageNumber) {
        if (!clone || !clone.isAlive) return false;

        // 造成伤害
        const isDead = clone.takeDamage(this.attackDamage);

        // 显示伤害数字
        if (scene && damageNumbers && createDamageNumber) {
            const damageNum = createDamageNumber(scene, clone.getPosition(), this.attackDamage, false);
            damageNumbers.push(damageNum);
        }

        return true;
    }

    /**
     * 选择新的游荡目标
     */
    chooseNewTarget() {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.wanderRadius;
        this.targetPosition = new THREE.Vector3(
            this.wanderCenter.x + Math.cos(angle) * distance,
            this.position.y,
            this.wanderCenter.z + Math.sin(angle) * distance
        );
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
        this.healthBar = null;
        this.healthBarGroup = null;
    }
}


