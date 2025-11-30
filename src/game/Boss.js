/**
 * 史诗级Boss类
 */
import { Monster } from './Monster.js';
import { Treasure } from './Treasure.js';
import { DamageNumber } from './DamageNumber.js';

export class Boss extends Monster {
    constructor(id, position, levelNum, modelManager = null, isMiniBoss = false) {
        super(id, position, modelManager);
        this.maxHealth = isMiniBoss ? 100 : 500; // Boss血量500，小boss血量100
        this.currentHealth = isMiniBoss ? 100 : 500;
        this.levelNum = levelNum;
        this.isBoss = true;
        this.isMiniBoss = isMiniBoss; // 标记是否为小boss
        this.stars = []; // 浮动星星数组
        this.treasure = null; // Boss死亡时掉落的宝藏
        this.baseMoveSpeed = isMiniBoss ? 0.04 : 0.02; // 基础移动速度
        this.moveSpeed = this.baseMoveSpeed;
        this.baseAttackDamage = isMiniBoss ? 5 : 10; // 基础攻击力
        this.attackDamage = this.baseAttackDamage;
        this.isEnraged = false; // 是否进入狂暴模式
        this.baseScale = 1.0; // 基础缩放

        // 无敌帧系统
        this.isInvincible = false; // 是否处于无敌状态
        this.invincibleStartTime = 0; // 无敌开始时间
        this.invincibleDuration = 1000; // 无敌持续时间（1秒）
        this.hasTriggeredInvincible = false; // 是否已触发50%血量的无敌帧
    }

    /**
     * 创建Boss模型（更大更强）
     */
    createDefaultModel() {
        const bossGroup = new THREE.Group();

        // 小boss使用较小的尺寸
        const bodySize = this.isMiniBoss ? 0.84 : 1.2;
        const bodyHeight = this.isMiniBoss ? 1.12 : 1.6;

        // 身体（更大的立方体，深紫色，小boss和大boss颜色一致）
        const bodyGeometry = new THREE.BoxGeometry(bodySize, bodyHeight, bodySize);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x8b008b, // 小boss和大boss颜色一致
            emissive: 0x4b0082,
            emissiveIntensity: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = bodyHeight / 2;
        bossGroup.add(body);
        this.mesh = body;

        // 头部（更大的球体，深紫色，小boss和大boss颜色一致）
        const headSize = this.isMiniBoss ? 0.42 : 0.6;
        const headGeometry = new THREE.SphereGeometry(headSize, 16, 16);
        const headMaterial = new THREE.MeshPhongMaterial({
            color: 0x6a0080, // 小boss和大boss颜色一致
            emissive: 0x4b0082,
            emissiveIntensity: 0.4
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = bodyHeight + headSize;
        bossGroup.add(head);

        // 眼睛（红色发光）
        const eyeSize = this.isMiniBoss ? 0.105 : 0.15;
        const eyeGeometry = new THREE.SphereGeometry(eyeSize, 8, 8);
        const eyeMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.8
        });
        const eyeOffsetX = this.isMiniBoss ? 0.14 : 0.2;
        const eyeY = bodyHeight + headSize + 0.05;
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-eyeOffsetX, eyeY, bodySize * 0.4);
        bossGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(eyeOffsetX, eyeY, bodySize * 0.4);
        bossGroup.add(rightEye);

        // 腿部（更粗，小boss稍小）
        const legRadius = this.isMiniBoss ? 0.14 : 0.2;
        const legLength = this.isMiniBoss ? 0.56 : 0.8;
        const legGeometry = new THREE.CylinderGeometry(legRadius, legRadius, legLength, 8);
        const legMaterial = new THREE.MeshPhongMaterial({
            color: 0x8b008b // 小boss和大boss颜色一致
        });
        const legOffsetX = this.isMiniBoss ? 0.28 : 0.4;
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-legOffsetX, -legLength / 2, 0);
        bossGroup.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(legOffsetX, -legLength / 2, 0);
        bossGroup.add(rightLeg);

        // 手臂（更长更粗，小boss稍小）
        const armRadius = this.isMiniBoss ? 0.105 : 0.15;
        const armLength = this.isMiniBoss ? 0.7 : 1.0;
        const armGeometry = new THREE.CylinderGeometry(armRadius, armRadius, armLength, 8);
        const armOffsetX = this.isMiniBoss ? 0.49 : 0.7;
        const leftArm = new THREE.Mesh(armGeometry, legMaterial);
        leftArm.position.set(-armOffsetX, bodyHeight * 0.375, 0);
        leftArm.rotation.z = Math.PI / 6;
        bossGroup.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, legMaterial);
        rightArm.position.set(armOffsetX, bodyHeight * 0.375, 0);
        rightArm.rotation.z = -Math.PI / 6;
        bossGroup.add(rightArm);

        // 创建血量条
        this.createHealthBar(bossGroup);

        // 创建浮动星星
        this.createStars(bossGroup);

        this.group = bossGroup;
        this.group.position.copy(this.position);

        return bossGroup;
    }

    /**
     * 创建浮动星星效果
     */
    createStars(group) {
        // 小boss不显示星星
        if (this.isMiniBoss) {
            this.stars = [];
            return;
        }

        const starCount = 8; // 8颗星星
        this.stars = [];

        for (let i = 0; i < starCount; i++) {
            const starGeometry = new THREE.OctahedronGeometry(0.15, 0);
            const starMaterial = new THREE.MeshPhongMaterial({
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 0.8
            });
            const star = new THREE.Mesh(starGeometry, starMaterial);

            // 围绕Boss分布
            const angle = (i / starCount) * Math.PI * 2;
            const radius = 1.5 + Math.random() * 0.5;
            star.position.set(
                Math.cos(angle) * radius,
                2.5 + Math.random() * 0.5,
                Math.sin(angle) * radius
            );

            star.userData = {
                baseAngle: angle,
                baseRadius: radius,
                baseY: 2.5 + Math.random() * 0.5,
                rotationSpeed: 0.02 + Math.random() * 0.02,
                floatSpeed: 0.003 + Math.random() * 0.002
            };

            group.add(star);
            this.stars.push(star);
        }
    }

    /**
     * 更新星星动画
     */
    updateStars() {
        if (!this.isAlive || !this.stars) return;

        const time = Date.now() * 0.001;

        this.stars.forEach((star, index) => {
            const data = star.userData;

            // 围绕Boss旋转
            const angle = data.baseAngle + time * data.rotationSpeed;
            star.position.x = Math.cos(angle) * data.baseRadius;
            star.position.z = Math.sin(angle) * data.baseRadius;

            // 上下浮动
            star.position.y = data.baseY + Math.sin(time * 2 + index) * 0.3;

            // 自转
            star.rotation.y += 0.05;
            star.rotation.x += 0.03;
        });
    }

    /**
     * 受到伤害（重写以支持狂暴模式）
     * @param {number} damage 
     * @param {Object} options 
     * @returns {boolean}
     */
    takeDamage(damage, options = {}) {
        if (!this.isAlive) return false;

        // 检查无敌帧
        if (this.isInvincible) {
            // 无敌状态下不受伤害
            return false;
        }

        // 调试信息
        if (this.currentHealth - damage <= 0 && !this.isMiniBoss) {
            console.log(`Boss即将死亡，检查options:`);
            console.log(`  options.scene: ${!!options.scene}`);
            console.log(`  options.createMiniBossCallback: ${!!options.createMiniBossCallback}`);
            console.log(`  options.dropLootCallback: ${!!options.dropLootCallback}`);
            console.log(`  options对象:`, options);
        }

        const healthBefore = this.currentHealth;
        const healthAfter = Math.max(0, this.currentHealth - damage);

        // 检查是否触发50%血量的无敌帧（只有主Boss）
        if (!this.isMiniBoss && !this.hasTriggeredInvincible &&
            healthAfter <= this.maxHealth / 2 && healthBefore > this.maxHealth / 2) {
            // 触发无敌帧
            this.triggerInvincible();
        }

        this.currentHealth = healthAfter;
        this.updateHealthBar();

        // 检查是否触发狂暴模式（血量降到一半且未进入狂暴）
        if (!this.isMiniBoss && !this.isEnraged && this.currentHealth <= this.maxHealth / 2 && healthBefore > this.maxHealth / 2) {
            // 合并options和lastUpdateOptions（用于显示伤害数字）
            const enrageOptions = {
                ...options,
                ...this.lastUpdateOptions,
                damageNumbers: this.lastUpdateOptions.damageNumbers || options.damageNumbers,
                createDamageNumber: this.lastUpdateOptions.createDamageNumber || options.createDamageNumber
            };
            // 传递角色、场景和物理引擎用于爆炸效果
            this.enterEnrageMode(options.character, options.scene, options.physicsEngine, enrageOptions);
        }

        if (this.currentHealth <= 0) {
            // Boss死亡，调用die方法
            console.log(`Boss takeDamage: 血量归零，准备调用die方法`);
            console.log(`Boss takeDamage: options.scene = ${!!options.scene}, options.createMiniBossCallback = ${!!options.createMiniBossCallback}`);
            console.log(`Boss takeDamage: 准备传递的参数 - scene:`, options.scene, `callback:`, options.createMiniBossCallback, `dropLoot:`, options.dropLootCallback);

            // 直接传递options对象，更可靠
            console.log(`Boss takeDamage: 最终传递的options对象:`, options);

            const dieResult = this.die(options);
            // 如果是Promise，处理它
            if (dieResult && typeof dieResult.then === 'function') {
                dieResult.then(() => {
                    console.log('Boss死亡处理完成（异步）');
                }).catch(error => {
                    console.error('Boss死亡处理错误:', error);
                    console.error('错误堆栈:', error.stack);
                });
            }
            return true;
        }

        return false;
    }

    /**
     * 触发无敌帧
     */
    triggerInvincible() {
        if (this.isInvincible) return;

        this.isInvincible = true;
        this.invincibleStartTime = Date.now();
        this.hasTriggeredInvincible = true;

        console.log('Boss触发无敌帧（1秒）！');

        // 视觉反馈：闪烁效果
        if (this.group) {
            this.startInvincibleEffect();
        }
    }

    /**
     * 开始无敌帧视觉效果（闪烁）
     */
    startInvincibleEffect() {
        if (!this.group) return;

        const flashInterval = setInterval(() => {
            if (!this.isInvincible) {
                clearInterval(flashInterval);
                // 恢复可见性
                this.group.traverse((object) => {
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(mat => {
                                if (mat.opacity !== undefined) {
                                    mat.opacity = 1;
                                }
                            });
                        } else {
                            if (object.material.opacity !== undefined) {
                                object.material.opacity = 1;
                            }
                        }
                    }
                });
                return;
            }

            // 闪烁效果
            this.group.traverse((object) => {
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(mat => {
                            if (mat.opacity !== undefined) {
                                mat.opacity = mat.opacity === 1 ? 0.3 : 1;
                                mat.transparent = true;
                            }
                        });
                    } else {
                        if (object.material.opacity !== undefined) {
                            object.material.opacity = object.material.opacity === 1 ? 0.3 : 1;
                            object.material.transparent = true;
                        }
                    }
                }
            });
        }, 100); // 每100ms闪烁一次
    }

    /**
     * 更新无敌帧状态
     */
    updateInvincible() {
        if (!this.isInvincible) return;

        const currentTime = Date.now();
        if (currentTime - this.invincibleStartTime >= this.invincibleDuration) {
            this.isInvincible = false;
            console.log('Boss无敌帧结束');
        }
    }

    /**
     * 进入狂暴模式
     * @param {Character} character 角色对象（用于锁定和爆炸）
     * @param {THREE.Scene} scene 场景对象（用于显示爆炸效果）
     * @param {PhysicsEngine} physicsEngine 物理引擎（用于弹飞角色）
     * @param {Object} options 额外选项（用于显示伤害数字）
     */
    enterEnrageMode(character = null, scene = null, physicsEngine = null, options = {}) {
        if (this.isEnraged) return;

        this.isEnraged = true;
        console.log('Boss进入狂暴模式！');

        // 立刻锁定主角
        if (character) {
            this.hasAggro = true;
            this.characterTarget = character;
        }

        // 身体变大5倍
        if (this.group) {
            this.group.scale.multiplyScalar(5);
            this.baseScale = 5.0;
        }

        // 移动速度1.5倍
        this.moveSpeed = this.baseMoveSpeed * 1.5;

        // 伤害变成2倍
        this.attackDamage = this.baseAttackDamage * 2;

        // 改变颜色为红色（狂暴效果）
        if (this.group) {
            this.group.traverse((object) => {
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(mat => {
                            if (mat.emissive) {
                                mat.emissive.setHex(0xff0000);
                                mat.emissiveIntensity = 0.8;
                            }
                        });
                    } else {
                        if (object.material.emissive) {
                            object.material.emissive.setHex(0xff0000);
                            object.material.emissiveIntensity = 0.8;
                        }
                    }
                }
            });
        }

        // 向周围爆炸，弹飞主角并造成伤害
        if (character && scene && physicsEngine) {
            this.explode(character, scene, physicsEngine, options);
        }
    }

    /**
     * 爆炸效果：弹飞主角并造成伤害
     * @param {Character} character 角色对象
     * @param {THREE.Scene} scene 场景对象
     * @param {PhysicsEngine} physicsEngine 物理引擎
     * @param {Object} options 额外选项（用于显示伤害数字）
     */
    explode(character, scene, physicsEngine, options = {}) {
        if (!character || !character.isAlive) return;

        const characterPosition = character.getPosition();
        const bossPosition = this.position;

        // 计算方向（从Boss指向角色）
        const direction = characterPosition.clone().sub(bossPosition);
        const distance = direction.length();

        // 如果角色在爆炸范围内（10个单位）
        const explosionRange = 10;
        if (distance <= explosionRange) {
            // 造成50点伤害
            const explosionDamage = 50;
            const isDead = character.takeDamage(explosionDamage);

            // 显示伤害数字（通过回调函数）
            if (options.createDamageNumber && scene) {
                const damageNum = options.createDamageNumber(scene, characterPosition, explosionDamage, false);
                if (options.damageNumbers) {
                    options.damageNumbers.push(damageNum);
                }
            }

            // 弹飞角色：给角色一个向上的速度和远离Boss的速度
            if (physicsEngine) {
                // 计算弹飞方向（远离Boss，带一点向上）
                direction.normalize();
                direction.y = 0.5; // 向上分量
                direction.normalize();

                // 设置弹飞速度
                const knockbackForce = 0.3; // 弹飞力度
                const knockbackVelocity = direction.multiplyScalar(knockbackForce);

                // 应用弹飞效果（通过修改角色位置）
                const newPosition = characterPosition.clone().add(knockbackVelocity.multiplyScalar(5));
                newPosition.y = Math.max(1.5, newPosition.y); // 确保不在地面以下

                // 设置角色位置
                character.setPosition(newPosition);

                // 给角色一个向上的速度（模拟被弹飞）
                if (physicsEngine.verticalVelocity !== undefined) {
                    physicsEngine.verticalVelocity = 0.2; // 向上弹飞
                    physicsEngine.isGrounded = false;
                }
            }

            console.log(`Boss爆炸！对角色造成${explosionDamage}点伤害并弹飞！`);
        }
    }

    /**
     * 死亡时创建宝藏或分裂
     * @param {THREE.Scene|Object} sceneOrOptions 场景对象，或者包含所有选项的对象
     * @param {Function} createMiniBossCallback 创建小boss的回调函数（如果第一个参数是options对象，此参数会被忽略）
     * @param {Function} dropLootCallback 掉落物品的回调函数（如果第一个参数是options对象，此参数会被忽略）
     */
    async die(sceneOrOptions = null, createMiniBossCallback = null, dropLootCallback = null) {
        super.die();

        // 支持两种调用方式：
        // 1. die(scene, callback, dropLoot) - 旧方式
        // 2. die({scene, createMiniBossCallback, dropLootCallback}) - 新方式（更可靠）
        let scene, callback, dropLoot;

        console.log(`die方法第一个参数:`, sceneOrOptions);
        console.log(`die方法第一个参数类型:`, typeof sceneOrOptions);
        console.log(`die方法第一个参数是否有scene属性:`, sceneOrOptions && sceneOrOptions.scene !== undefined);
        console.log(`die方法第一个参数是否有createMiniBossCallback属性:`, sceneOrOptions && sceneOrOptions.createMiniBossCallback !== undefined);
        console.log(`die方法第二个参数:`, createMiniBossCallback, `类型:`, typeof createMiniBossCallback);

        // 检查第一个参数是否是options对象
        // 判断标准：如果第一个参数有scene或createMiniBossCallback属性，且第二个参数不是函数，则认为是options对象
        // 或者：如果第一个参数有scene属性且第二个参数是undefined/null，也认为是options对象
        const isOptionsObject = sceneOrOptions && typeof sceneOrOptions === 'object' &&
            (sceneOrOptions.scene !== undefined || sceneOrOptions.createMiniBossCallback !== undefined) &&
            (createMiniBossCallback === null || createMiniBossCallback === undefined || typeof createMiniBossCallback !== 'function');

        if (isOptionsObject) {
            // 这是options对象
            console.log(`识别为options对象，提取属性`);
            const options = sceneOrOptions;
            scene = options.scene;
            callback = options.createMiniBossCallback;
            dropLoot = options.dropLootCallback;
        } else {
            // 旧方式：直接传递参数
            console.log(`使用旧方式：直接传递参数`);
            scene = sceneOrOptions;
            callback = createMiniBossCallback;
            dropLoot = dropLootCallback;
        }

        console.log(`Boss.die被调用！isMiniBoss: ${this.isMiniBoss}`);
        console.log(`参数检查 - scene: ${!!scene}, createMiniBossCallback: ${!!callback}, dropLootCallback: ${!!dropLoot}`);
        console.log(`scene类型: ${typeof scene}, callback类型: ${typeof callback}`);
        console.log(`die方法接收到的实际参数值:`, { scene, callback, dropLoot });

        // 如果是主Boss且不是小boss，则分裂成4个小boss
        if (!this.isMiniBoss && callback && scene) {
            console.log(`开始分裂成4个小boss，Boss位置: (${this.position.x.toFixed(2)}, ${this.position.y.toFixed(2)}, ${this.position.z.toFixed(2)})`);

            // 分裂成4个小boss
            const angles = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
            const distance = 3; // 分裂距离（增大距离避免重叠）

            // 使用Promise.all确保所有小boss都创建完成
            const createPromises = angles.map(async (angle, index) => {
                const offsetX = Math.cos(angle) * distance;
                const offsetZ = Math.sin(angle) * distance;
                const miniBossPosition = this.position.clone().add(
                    new THREE.Vector3(offsetX, this.position.y, offsetZ)
                );

                console.log(`准备创建小boss ${index + 1}，位置: (${miniBossPosition.x.toFixed(2)}, ${miniBossPosition.y.toFixed(2)}, ${miniBossPosition.z.toFixed(2)})`);

                // 调用回调函数创建小boss（确保是异步的）
                try {
                    await callback(miniBossPosition, this.levelNum, scene);
                    console.log(`小boss ${index + 1} 创建成功`);
                } catch (error) {
                    console.error(`创建小boss ${index + 1} 失败:`, error);
                }
            });

            // 等待所有小boss创建完成
            try {
                await Promise.all(createPromises);
                console.log(`Boss分裂成4个小boss完成！`);
            } catch (error) {
                console.error('创建小boss时出错:', error);
            }
        } else {
            if (this.isMiniBoss) {
                console.log('这是小boss，不分裂');
            }
            if (!callback) {
                console.log('没有createMiniBossCallback回调函数');
            }
            if (!scene) {
                console.log('没有scene对象');
            }
        }

        // Boss死亡时掉落物品（只有主Boss）
        if (!this.isMiniBoss && dropLoot) {
            dropLoot(this.levelNum);
        }
    }

    /**
     * 更新Boss（包括星星动画和移动）
     */
    update(characterPosition, collisionDetector, character = null, scene = null, damageNumbers = [], createDamageNumber = null, options = {}) {
        // 更新无敌帧状态
        this.updateInvincible();

        // 更新星星动画
        this.updateStars();

        // 保存options以便在takeDamage中使用
        this.lastUpdateOptions = options;

        // 从options中获取cloneSystem
        const cloneSystem = options.cloneSystem || null;

        // 调用父类的移动更新（包括仇恨系统和分身攻击）
        return super.update(characterPosition, collisionDetector, character, scene, damageNumbers, createDamageNumber, cloneSystem);
    }

    /**
     * 获取掉落的宝藏
     */
    getTreasure() {
        return this.treasure;
    }
}

