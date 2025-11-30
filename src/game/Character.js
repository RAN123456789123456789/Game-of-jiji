/**
 * 角色类
 */
import { GameConfig } from '../config/GameConfig.js';
import { ModelManager } from '../models/ModelManager.js';
import { EquipmentSystem } from './EquipmentSystem.js';
import { CombatPowerSystem } from './CombatPowerSystem.js';

export class Character {
    constructor(modelManager = null) {
        this.modelManager = modelManager;
        this.group = null;
        this.normalModel = null; // 正常状态模型
        this.runningModel = null; // 奔跑状态模型
        this.currentModelType = 'normal'; // 当前模型类型：'normal' 或 'running'
        this.position = new THREE.Vector3(0, 1.5, 0);
        this.moveSpeed = GameConfig.character.baseMoveSpeed;
        this.jumpPower = GameConfig.character.baseJumpPower;
        this.activeEffects = {};
        this.effectTimers = {};
        this.maxHealth = 100; // 最大血量
        this.currentHealth = 100; // 当前血量
        this.isAlive = true;

        // 装备系统和战力系统
        this.equipmentSystem = new EquipmentSystem();
        this.combatPowerSystem = new CombatPowerSystem();
    }

    /**
     * 创建角色模型
     * @returns {THREE.Group}
     */
    async createModel() {
        // 如果模型管理器存在且注册了角色模型，则加载
        if (this.modelManager) {
            try {
                // 加载正常状态模型
                try {
                    this.normalModel = await this.modelManager.getModel('character_default');
                    this.normalModel.position.copy(this.position);
                    this.normalModel.visible = false; // 第一人称视角中隐藏
                    // 初始方向与相机控制器一致（0度）
                    this.normalModel.rotation.set(0, 0, 0);
                } catch (error) {
                    console.warn('加载正常状态模型失败:', error);
                }

                // 加载奔跑状态模型
                try {
                    this.runningModel = await this.modelManager.getModel('character_running');
                    this.runningModel.position.copy(this.position);
                    this.runningModel.visible = false; // 第一人称视角中隐藏
                    // 初始方向与相机控制器一致（0度）
                    this.runningModel.rotation.set(0, 0, 0);
                } catch (error) {
                    console.warn('加载奔跑状态模型失败:', error);
                }

                // 如果成功加载了模型，使用第一个可用的模型
                if (this.normalModel) {
                    this.group = this.normalModel;
                    this.currentModelType = 'normal';
                    return this.group;
                } else if (this.runningModel) {
                    this.group = this.runningModel;
                    this.currentModelType = 'running';
                    return this.group;
                }
            } catch (error) {
                console.warn('加载角色模型失败，使用默认模型:', error);
            }
        }

        // 使用默认的简单几何体模型
        return this.createDefaultModel();
    }

    /**
     * 切换到奔跑模型
     */
    async switchToRunningModel() {
        if (this.currentModelType === 'running') return; // 已经是奔跑模型

        if (this.runningModel) {
            // 保存当前位置和旋转
            const position = this.group ? this.group.position.clone() : this.position.clone();
            const rotation = this.group ? this.group.rotation.clone() : new THREE.Euler();
            const scale = this.group ? this.group.scale.clone() : new THREE.Vector3(1, 1, 1);
            const visible = this.group ? this.group.visible : false;

            // 隐藏正常模型
            if (this.normalModel) {
                this.normalModel.visible = false;
            }

            // 切换到奔跑模型
            this.group = this.runningModel;
            this.group.position.copy(position);
            this.group.rotation.copy(rotation);
            this.group.scale.copy(scale);
            this.group.visible = visible;

            // 确保奔跑模型在场景中
            if (!this.group.parent && this.normalModel && this.normalModel.parent) {
                this.normalModel.parent.add(this.group);
            }

            this.currentModelType = 'running';
        }
    }

    /**
     * 切换到正常模型
     */
    async switchToNormalModel() {
        if (this.currentModelType === 'normal') return; // 已经是正常模型

        if (this.normalModel) {
            // 保存当前位置和旋转
            const position = this.group ? this.group.position.clone() : this.position.clone();
            const yRotation = this.group ? this.group.rotation.y : 0; // 只保存Y轴旋转
            const scale = this.group ? this.group.scale.clone() : new THREE.Vector3(1, 1, 1);
            const visible = this.group ? this.group.visible : false;

            // 隐藏奔跑模型
            if (this.runningModel) {
                this.runningModel.visible = false;
            }

            // 切换到正常模型
            this.group = this.normalModel;
            this.group.position.copy(position);
            this.group.rotation.set(0, yRotation, 0); // 保持Y轴旋转，重置X和Z
            this.group.scale.copy(scale);
            this.group.visible = visible;

            // 确保正常模型在场景中
            if (!this.group.parent && this.runningModel && this.runningModel.parent) {
                this.runningModel.parent.add(this.group);
            }

            this.currentModelType = 'normal';
        }
    }

    /**
     * 创建默认角色模型（简易几何体）
     */
    createDefaultModel() {
        const characterGroup = new THREE.Group();

        // 身体（圆柱体）
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.8, 16);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xffb6c1 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.4;
        characterGroup.add(body);

        // 头部（球体）
        const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.1;
        characterGroup.add(head);

        // 紫色长发
        const hairColor = 0x8b4c9f;
        const hairMaterial = new THREE.MeshPhongMaterial({ color: hairColor });

        for (let i = 0; i < 3; i++) {
            const hairGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.8, 8);
            const hair = new THREE.Mesh(hairGeometry, hairMaterial);
            hair.position.set(-0.3 - i * 0.1, 0.9 - i * 0.2, 0);
            hair.rotation.z = -0.3;
            characterGroup.add(hair);
        }

        for (let i = 0; i < 3; i++) {
            const hairGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.8, 8);
            const hair = new THREE.Mesh(hairGeometry, hairMaterial);
            hair.position.set(0.3 + i * 0.1, 0.9 - i * 0.2, 0);
            hair.rotation.z = 0.3;
            characterGroup.add(hair);
        }

        const backHairGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.9, 8);
        const backHair = new THREE.Mesh(backHairGeometry, hairMaterial);
        backHair.position.set(0, 0.85, -0.2);
        characterGroup.add(backHair);

        // 金丝眼镜
        const glassesColor = 0xffd700;
        const glassesMaterial = new THREE.MeshPhongMaterial({ color: glassesColor });

        const leftLensGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16);
        const leftLens = new THREE.Mesh(leftLensGeometry, glassesMaterial);
        leftLens.position.set(-0.15, 1.05, 0.35);
        leftLens.rotation.x = Math.PI / 2;
        characterGroup.add(leftLens);

        const rightLensGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16);
        const rightLens = new THREE.Mesh(rightLensGeometry, glassesMaterial);
        rightLens.position.set(0.15, 1.05, 0.35);
        rightLens.rotation.x = Math.PI / 2;
        characterGroup.add(rightLens);

        const bridgeGeometry = new THREE.BoxGeometry(0.3, 0.02, 0.02);
        const bridge = new THREE.Mesh(bridgeGeometry, glassesMaterial);
        bridge.position.set(0, 1.05, 0.35);
        characterGroup.add(bridge);

        const legGeometry = new THREE.BoxGeometry(0.15, 0.02, 0.02);
        const leftLeg = new THREE.Mesh(legGeometry, glassesMaterial);
        leftLeg.position.set(-0.25, 1.05, 0.3);
        leftLeg.rotation.z = -0.3;
        characterGroup.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, glassesMaterial);
        rightLeg.position.set(0.25, 1.05, 0.3);
        rightLeg.rotation.z = 0.3;
        characterGroup.add(rightLeg);

        // 眼睛
        const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 1.05, 0.38);
        characterGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 1.05, 0.38);
        characterGroup.add(rightEye);

        // 腿部
        const legGeometry2 = new THREE.CylinderGeometry(0.12, 0.15, 0.6, 8);
        const legMaterial = new THREE.MeshPhongMaterial({ color: 0xffb6c1 });
        const leftLeg2 = new THREE.Mesh(legGeometry2, legMaterial);
        leftLeg2.position.set(-0.15, -0.3, 0);
        characterGroup.add(leftLeg2);

        const rightLeg2 = new THREE.Mesh(legGeometry2, legMaterial);
        rightLeg2.position.set(0.15, -0.3, 0);
        characterGroup.add(rightLeg2);

        // 脚
        const footGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.3);
        const footMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
        const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
        leftFoot.position.set(-0.15, -0.65, 0.1);
        characterGroup.add(leftFoot);

        const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
        rightFoot.position.set(0.15, -0.65, 0.1);
        characterGroup.add(rightFoot);

        this.group = characterGroup;
        this.group.position.copy(this.position);
        this.group.visible = false; // 第一人称视角中隐藏
        // 初始方向与相机控制器一致（0度）
        this.group.rotation.set(0, 0, 0);

        return characterGroup;
    }

    /**
     * 应用道具效果
     * @param {Object} effect 
     */
    applyEffect(effect) {
        if (!effect) return;

        if (effect.type === 'speed') {
            // 清除旧的定时器
            if (this.effectTimers.speed) {
                clearTimeout(this.effectTimers.speed);
            }

            this.moveSpeed = GameConfig.character.baseMoveSpeed * effect.multiplier;
            this.activeEffects.speed = true;

            this.effectTimers.speed = setTimeout(() => {
                this.moveSpeed = GameConfig.character.baseMoveSpeed;
                this.activeEffects.speed = false;
                this.effectTimers.speed = null;
            }, effect.duration);

        } else if (effect.type === 'jump') {
            // 清除旧的定时器
            if (this.effectTimers.jump) {
                clearTimeout(this.effectTimers.jump);
            }

            this.jumpPower = GameConfig.character.baseJumpPower * effect.multiplier;
            this.activeEffects.jump = true;

            this.effectTimers.jump = setTimeout(() => {
                this.jumpPower = GameConfig.character.baseJumpPower;
                this.activeEffects.jump = false;
                this.effectTimers.jump = null;
            }, effect.duration);
        }
    }

    /**
     * 清除所有效果
     */
    clearEffects() {
        for (const timer of Object.values(this.effectTimers)) {
            if (timer) {
                clearTimeout(timer);
            }
        }
        this.activeEffects = {};
        this.effectTimers = {};
        this.moveSpeed = GameConfig.character.baseMoveSpeed;
        this.jumpPower = GameConfig.character.baseJumpPower;
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
     * 设置朝向（跟随相机朝向）
     * @param {number} yRotation Y轴旋转角度（弧度）
     */
    setRotation(yRotation) {
        // 更新当前使用的模型组的旋转
        if (this.group) {
            this.group.rotation.y = yRotation;
        }

        // 同时更新normalModel和runningModel的旋转（确保切换模型时旋转保持一致）
        if (this.normalModel) {
            this.normalModel.rotation.y = yRotation;
        }
        if (this.runningModel) {
            this.runningModel.rotation.y = yRotation;
        }
    }

    /**
     * 受到伤害（考虑魔抗减伤）
     * @param {number} damage 伤害值
     * @returns {boolean} 是否死亡
     */
    takeDamage(damage) {
        if (!this.isAlive) return false;

        // 获取魔抗属性
        const stats = this.getCombatStats();
        const magicResist = stats.magicResist || 0;

        // 魔抗减伤：1点魔抗减少1点伤害
        const actualDamage = Math.max(0, damage - magicResist);

        this.currentHealth = Math.max(0, this.currentHealth - actualDamage);

        if (this.currentHealth <= 0) {
            this.currentHealth = 0;
            this.isAlive = false;
            return true; // 返回true表示已死亡
        }

        return false; // 返回false表示还活着
    }

    /**
     * 恢复血量
     * @param {number} amount 恢复量
     */
    heal(amount) {
        if (!this.isAlive) return;
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }

    /**
     * 获取血量百分比
     */
    getHealthPercent() {
        return this.currentHealth / this.maxHealth;
    }

    /**
     * 重置角色状态
     */
    reset() {
        this.position.set(0, 1.5, 0);
        this.moveSpeed = GameConfig.character.baseMoveSpeed;
        this.jumpPower = GameConfig.character.baseJumpPower;
        this.clearEffects();
        this.currentHealth = this.maxHealth;
        this.isAlive = true;
    }

    /**
     * 获取战斗属性（包括装备加成和基础属性）
     * @returns {Object} 属性对象
     */
    getCombatStats() {
        const equipmentStats = this.equipmentSystem.getTotalStats();
        // 添加基础吸血3点
        return {
            attack: equipmentStats.attack || 0,
            critRate: equipmentStats.critRate || 0,
            lifesteal: (equipmentStats.lifesteal || 0) + 3, // 基础吸血3点
            magicResist: equipmentStats.magicResist || 0
        };
    }

    /**
     * 计算战力
     * @returns {number} 战力值
     */
    getCombatPower() {
        const stats = this.getCombatStats();
        stats.health = this.maxHealth; // 添加血量
        return this.combatPowerSystem.calculatePower(stats);
    }

    /**
     * 装备物品
     * @param {Item} item 要装备的物品
     * @returns {Item|null} 被替换的装备
     */
    equipItem(item) {
        return this.equipmentSystem.equip(item);
    }

    /**
     * 卸下装备
     * @param {string} slot 装备槽位
     * @returns {Item|null} 被卸下的装备
     */
    unequipItem(slot) {
        return this.equipmentSystem.unequip(slot);
    }

    /**
     * 获取装备
     * @param {string} slot 装备槽位
     * @returns {Item|null}
     */
    getEquipment(slot) {
        return this.equipmentSystem.getEquipment(slot);
    }

    /**
     * 获取所有装备
     * @returns {Object}
     */
    getAllEquipment() {
        return this.equipmentSystem.getAllEquipment();
    }

    /**
     * 清理资源
     */
    dispose() {
        this.clearEffects();
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


