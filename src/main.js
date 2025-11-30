/**
 * 游戏主入口
 * 整合所有模块
 */
import { GameConfig } from './config/GameConfig.js';
import { LevelConfig } from './config/LevelConfig.js';
import { SceneManager } from './core/SceneManager.js';
import { Renderer } from './core/Renderer.js';
import { CameraController } from './core/CameraController.js';
import { ModelManager } from './models/ModelManager.js';
import { ModelLoader } from './models/ModelLoader.js';
import { LevelManager } from './game/LevelManager.js';
import { Character } from './game/Character.js';
import { Inventory } from './game/Inventory.js';
import { CombatSystem } from './game/CombatSystem.js';
import { GameProgress } from './game/GameProgress.js';
import { PhysicsEngine } from './physics/PhysicsEngine.js';
import { LevelSelector } from './ui/LevelSelector.js';
import { InventoryUI } from './ui/InventoryUI.js';
import { GameUI } from './ui/GameUI.js';
import { CharacterHealthUI } from './ui/CharacterHealthUI.js';
import { DamageNumber } from './game/DamageNumber.js';
import { Item } from './game/Item.js';
import { CharacterPanel } from './ui/CharacterPanel.js';
import { SkillSystem } from './game/SkillSystem.js';
import { CloneSystem } from './game/CloneSystem.js';

class Game {
    constructor() {
        // 核心系统
        this.renderer = null;
        this.cameraController = null;
        this.sceneManager = new SceneManager();

        // 游戏系统
        this.levelManager = new LevelManager();
        this.character = null;
        this.inventory = new Inventory();
        this.physicsEngine = null;
        this.combatSystem = new CombatSystem();
        this.gameProgress = new GameProgress();

        // 模型管理
        this.modelManager = new ModelManager();

        // UI系统
        this.levelSelector = null;
        this.inventoryUI = null;
        this.gameUI = new GameUI();
        this.characterHealthUI = null;
        this.characterPanel = null;

        // 伤害数字系统
        this.damageNumbers = [];

        // 技能系统
        this.skillSystem = null;
        this.cloneSystem = null;

        // 游戏状态
        this.keys = {};
        this.animationId = null;
        this.currentLevel = null;
        this.isRunning = false;
        this.levelCompleted = false; // 防止重复触发完成事件

        // 初始化
        this.init();
    }

    async init() {
        // 初始化模型管理器（可以在这里注册GLTFLoader等）
        // 如果需要加载GLTF模型，注册GLTFLoader
        try {
            // 动态导入GLTFLoader
            // 尝试使用importmap路径，如果失败则使用完整URL
            let GLTFLoader;
            try {
                const module = await import('three/addons/loaders/GLTFLoader.js');
                GLTFLoader = module.GLTFLoader;
            } catch (e) {
                // 如果importmap失败，使用完整的CDN URL
                const module = await import('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js');
                GLTFLoader = module.GLTFLoader;
            }

            this.modelManager.initialize({
                gltf: new GLTFLoader()
            });

            // 注册角色模型（正常状态和奔跑状态）
            // 注册正常状态模型
            this.modelManager.registerModel('character_default', 'assets/models/characters/anthropomorphic fox 3d model.glb', 'gltf', 'character');
            // 注册奔跑状态模型
            this.modelManager.registerModel('character_running', 'assets/models/characters/anthropomorphic+fox+3d+model.glb', 'gltf', 'character');
        } catch (error) {
            console.warn('无法加载GLTFLoader或注册模型，将使用默认模型:', error);
            console.error('错误详情:', error);
        }

        // 创建角色
        this.character = new Character(this.modelManager);
        await this.character.createModel();

        // 初始化UI
        this.initUI();

        // 设置键盘事件
        this.setupKeyboardControls();

        // 设置鼠标事件
        this.setupMouseControls();

        // 设置窗口大小变化事件
        window.addEventListener('resize', () => this.handleResize());

        // 监听返回主菜单事件
        window.addEventListener('backToMain', () => {
            this.backToMain();
        });
    }

    initUI() {
        // 关卡选择器
        const mainContainer = document.querySelector('.container');
        if (!mainContainer) {
            console.error('找不到 .container 元素');
            return;
        }
        try {
            this.levelSelector = new LevelSelector(mainContainer, (levelNum) => {
                this.startLevel(levelNum);
            });
        } catch (error) {
            console.error('初始化UI失败:', error);
        }

        // 背包UI（稍后在关卡页面创建）
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();
            this.keys[key] = true;

            // 当游戏运行时，阻止所有可能导致页面滚动的按键
            if (this.isRunning) {
                // 阻止空格键的默认滚动行为
                if (key === ' ' || event.code === 'Space') {
                    event.preventDefault();
                }
                // 阻止方向键的默认滚动行为
                if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key) ||
                    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
                    event.preventDefault();
                }
                // 阻止PageUp/PageDown的默认滚动行为
                if (key === 'pageup' || key === 'pagedown' ||
                    event.code === 'PageUp' || event.code === 'PageDown') {
                    event.preventDefault();
                }
                // 阻止Home/End键的默认滚动行为
                if (key === 'home' || key === 'end' ||
                    event.code === 'Home' || event.code === 'End') {
                    event.preventDefault();
                }
            }

            // ESC键退出指针锁定
            if (key === 'escape' && this.cameraController && this.cameraController.isPointerLocked) {
                this.cameraController.exitPointerLock();
            }

            // B键打开/关闭背包
            if (key === 'b' && this.inventoryUI) {
                const isOpen = this.inventoryUI.toggle();
                if (this.cameraController) {
                    this.cameraController.setInventoryOpen(isOpen);
                }
            }

            // C键打开/关闭角色界面
            if (key === 'c' && this.characterPanel) {
                const isOpen = this.characterPanel.toggle();
                if (this.cameraController) {
                    this.cameraController.setInventoryOpen(isOpen);
                }
            }

            // Tab键切换视角（第一人称/第三视角）
            if (key === 'tab' && this.cameraController && this.isRunning) {
                event.preventDefault(); // 防止Tab键的默认行为（切换焦点）
                this.cameraController.toggleCameraMode();

                // 切换视角时，更新角色模型的可见性
                if (this.character) {
                    const isThirdPerson = this.cameraController.getCameraMode() === 'thirdPerson';
                    if (this.character.group) {
                        this.character.group.visible = isThirdPerson;
                    }
                    if (this.character.normalModel) {
                        this.character.normalModel.visible = isThirdPerson;
                    }
                    if (this.character.runningModel) {
                        this.character.runningModel.visible = isThirdPerson;
                    }
                }
            }

            // 1键使用分身技能
            if (key === '1' && this.isRunning && this.skillSystem && this.cloneSystem) {
                const scene = this.levelManager.sceneManager.getScene();
                const characterPosition = this.character.getPosition();
                const characterStats = this.character.getCombatStats();

                this.skillSystem.useCloneSkill(async (position, health, attack, duration) => {
                    await this.cloneSystem.createClone(position, health, attack, duration, characterPosition);
                });
            }

            // 2键使用龙虎拳技能
            if (key === '2' && this.isRunning && this.skillSystem && this.cameraController) {
                const direction = this.cameraController.getForwardDirection();
                const scene = this.levelManager.sceneManager.getScene();

                this.skillSystem.useDragonTigerSkill(
                    direction,
                    (scene, position, damage, isHeal, isCrit) => new DamageNumber(scene, position, damage, isHeal, isCrit),
                    this.damageNumbers,
                    (position, levelNum, sceneParam) => {
                        return this.createMiniBoss(position, levelNum, sceneParam || scene);
                    },
                    (levelNum) => this.dropBossLoot(levelNum)
                );
            }

            // Shift键按住时切换到奔跑模型
            if ((key === 'shift' || event.code === 'ShiftLeft' || event.code === 'ShiftRight') && this.isRunning && this.character) {
                this.character.switchToRunningModel();
            }
        });

        document.addEventListener('keyup', (event) => {
            const key = event.key.toLowerCase();
            this.keys[key] = false;

            // Shift键松开时切换回正常模型
            if ((key === 'shift' || event.code === 'ShiftLeft' || event.code === 'ShiftRight') && this.character) {
                this.character.switchToNormalModel();
            }
        });
    }

    setupMouseControls() {
        let isMouseDown = false;

        document.addEventListener('mousedown', (event) => {
            if (event.button === 0) { // 左键
                isMouseDown = true;
                if (this.isRunning && this.cameraController && this.cameraController.isPointerLocked) {
                    this.performAttack();
                }
            }
        });

        document.addEventListener('mouseup', (event) => {
            if (event.button === 0) { // 左键
                isMouseDown = false;
            }
        });
    }

    performAttack() {
        if (!this.character || !this.cameraController || !this.combatSystem) return;

        const characterPosition = this.character.getPosition();

        // 使用相机控制器的方法获取前方向
        const direction = this.cameraController.getForwardDirection();

        // 获取所有活着的怪兽
        const monsters = this.levelManager.getAliveMonsters();
        if (monsters.length === 0) return;

        // 执行攻击
        const hitMonsters = this.combatSystem.attack(characterPosition, direction, monsters);

        // 获取场景（用于显示伤害数字和Boss死亡时创建宝藏）
        const scene = this.levelManager.sceneManager.getScene();

        // 对击中的怪兽造成伤害
        for (const monster of hitMonsters) {
            const options = monster.isBoss ? {
                scene,
                character: this.character,
                physicsEngine: this.physicsEngine,
                createMiniBossCallback: (position, levelNum, sceneParam) => {
                    console.log(`createMiniBossCallback被调用，position:`, position, `levelNum:`, levelNum);
                    return this.createMiniBoss(position, levelNum, sceneParam || scene);
                },
                dropLootCallback: (levelNum) => this.dropBossLoot(levelNum)
            } : { character: this.character };

            // 调试：检查options是否正确设置
            if (monster.isBoss && !monster.isMiniBoss) {
                console.log(`准备攻击Boss，options设置:`, {
                    hasScene: !!options.scene,
                    hasCharacter: !!options.character,
                    hasPhysicsEngine: !!options.physicsEngine,
                    hasCallback: !!options.createMiniBossCallback,
                    hasDropLoot: !!options.dropLootCallback
                });
            }

            const result = this.combatSystem.damageMonster(monster, options);
            const isDead = result.isDead || result; // 兼容旧代码
            const damage = result.damage || this.combatSystem.getBaseAttackDamage();
            const isCrit = result.isCrit || false;

            // 显示伤害数字（攻击怪物）
            if (scene) {
                const damageNum = new DamageNumber(scene, monster.getPosition(), damage, false, isCrit);
                this.damageNumbers.push(damageNum);
            }

            // 显示治疗数字（吸血）
            const stats = this.character.getCombatStats();
            if (scene && stats.lifesteal > 0) {
                const healNum = new DamageNumber(scene, characterPosition, stats.lifesteal, true);
                this.damageNumbers.push(healNum);
            }

            if (isDead) {
                if (monster.isBoss && !monster.isMiniBoss) {
                    console.log(`史诗级Boss ${monster.id} 被击败！`);
                    // Boss死亡时掉落物品（在die方法中通过dropLootCallback处理）
                } else if (monster.isBoss && monster.isMiniBoss) {
                    console.log(`小Boss ${monster.id} 被击败！`);
                } else {
                    console.log(`怪兽 ${monster.id} 被击败！`);
                }
            } else {
                console.log(`怪兽 ${monster.id} 受到 ${damage} 点伤害${isCrit ? '（暴击）' : ''}，剩余血量：${monster.currentHealth}`);
            }
        }

        // 更新UI显示
        if (this.gameUI && hitMonsters.length > 0) {
            this.gameUI.showAttackFeedback(hitMonsters.length);
        }
    }

    checkLevelComplete() {
        if (!this.currentLevel || this.levelCompleted) return;

        // 检查是否所有怪兽、Boss和小Boss都被击败
        const aliveMonsters = this.levelManager.getAliveMonsters();
        const totalMonsters = this.levelManager.monsters.length +
            (this.levelManager.boss ? 1 : 0) +
            this.levelManager.miniBosses.length;
        if (aliveMonsters.length === 0 && totalMonsters > 0) {
            // 所有怪兽和Boss都被击败，关卡完成
            this.levelCompleted = true;
            this.onLevelComplete();
        }
    }

    onLevelComplete() {
        if (!this.currentLevel) return;

        // 停止游戏循环
        this.isRunning = false;

        // 标记关卡完成
        this.gameProgress.completeLevel(this.currentLevel);

        // 显示胜利UI
        if (this.gameUI) {
            this.gameUI.showVictory(this.currentLevel);
        }

        // 更新关卡选择器状态
        if (this.levelSelector) {
            this.levelSelector.updateLevelStatus();
        }
    }

    /**
     * 角色死亡处理
     */
    onCharacterDeath() {
        // 停止游戏循环
        this.isRunning = false;

        // 显示失败界面
        if (this.gameUI) {
            this.gameUI.showFailure(
                () => this.restartLevel(),
                () => this.backToMain()
            );
        }
    }

    /**
     * 重新开始当前关卡
     */
    restartLevel() {
        if (!this.currentLevel) return;

        // 重置角色状态
        this.character.reset();

        // 重新加载关卡
        this.startLevel(this.currentLevel);
    }

    async startLevel(levelNum) {
        // 隐藏主界面
        this.levelSelector.hide();

        // 清理之前的关卡
        this.cleanupLevel();

        // 创建关卡页面
        const levelPage = this.gameUI.createLevelPage(levelNum);
        document.body.appendChild(levelPage);

        // 等待DOM更新
        await new Promise(resolve => setTimeout(resolve, 100));

        // 加载关卡
        const container = document.getElementById('scene3d');
        if (!container) {
            console.error('找不到场景容器');
            return;
        }

        // 创建渲染器
        this.renderer = new Renderer(container);

        // 创建相机控制器
        this.cameraController = new CameraController(container);
        const canvas = this.renderer.getDomElement();
        if (canvas) {
            this.cameraController.setCanvas(canvas);
            // 设置canvas后初始化鼠标锁定
            this.cameraController.setupPointerLock();
        }

        // 加载关卡
        const { scene, collisionDetector, treasure, monsters, boss, levelConfig } = await this.levelManager.loadLevel(levelNum);

        // 添加角色模型到场景（正常和奔跑模型都需要添加）
        if (this.character.normalModel) {
            scene.add(this.character.normalModel);
        }
        if (this.character.runningModel) {
            scene.add(this.character.runningModel);
        }

        // 确保当前使用的模型在场景中
        const characterModel = this.character.group;
        if (characterModel && !characterModel.parent) {
            scene.add(characterModel);
        }

        // 根据当前视角模式设置角色模型可见性
        if (this.cameraController) {
            const isThirdPerson = this.cameraController.getCameraMode() === 'thirdPerson';
            if (this.character.group) {
                this.character.group.visible = isThirdPerson;
            }
            if (this.character.normalModel) {
                this.character.normalModel.visible = isThirdPerson;
            }
            if (this.character.runningModel) {
                this.character.runningModel.visible = isThirdPerson;
            }
        }

        // 创建物理引擎
        this.physicsEngine = new PhysicsEngine(collisionDetector);

        // 初始化技能系统和分身系统
        this.skillSystem = new SkillSystem(this.character, scene, this.combatSystem, this.levelManager);
        this.cloneSystem = new CloneSystem(scene, this.combatSystem, this.levelManager, this.modelManager, this.levelManager.collisionDetector);

        // 创建背包UI（浮动在场景上方）
        const sceneContainer = document.querySelector('.scene-container');
        const inventoryContainer = document.createElement('div');
        inventoryContainer.id = 'inventory';
        inventoryContainer.className = 'inventory';
        inventoryContainer.style.display = 'none'; // 默认隐藏
        sceneContainer.appendChild(inventoryContainer);

        this.inventoryUI = new InventoryUI(
            inventoryContainer,
            this.inventory,
            (index) => this.useItem(index),
            (index) => this.deleteItem(index),
            (isOpen) => {
                // 背包状态变化时的回调
                if (this.cameraController) {
                    this.cameraController.setInventoryOpen(isOpen);
                }
            },
            (index) => this.equipItemFromInventory(index)
        );

        // 绑定背包切换按钮
        const inventoryToggleBtn = document.getElementById('inventory-toggle-btn');
        if (inventoryToggleBtn) {
            inventoryToggleBtn.addEventListener('click', () => {
                const isOpen = this.inventoryUI.toggle();
                if (this.cameraController) {
                    this.cameraController.setInventoryOpen(isOpen);
                }
            });
        }

        // 创建角色血条UI
        const healthContainer = document.createElement('div');
        healthContainer.id = 'character-health';
        healthContainer.className = 'character-health';
        sceneContainer.appendChild(healthContainer);
        this.characterHealthUI = new CharacterHealthUI(healthContainer, this.character);

        // 创建角色界面UI
        const characterPanelContainer = document.createElement('div');
        characterPanelContainer.id = 'character-panel-container';
        characterPanelContainer.className = 'character-panel-container';
        sceneContainer.appendChild(characterPanelContainer);
        this.characterPanel = new CharacterPanel(
            characterPanelContainer,
            this.character,
            this.inventory,
            (index) => this.equipItemFromInventory(index),
            (slot, equipment) => this.unequipItem(slot, equipment)
        );

        // 添加角色界面切换按钮
        const characterPanelBtn = document.createElement('button');
        characterPanelBtn.className = 'character-panel-toggle-btn';
        characterPanelBtn.id = 'character-panel-toggle-btn';
        characterPanelBtn.innerHTML = '<span class="character-btn-icon">👤</span><span class="character-btn-text">角色</span>';
        characterPanelBtn.title = '打开角色界面 (C)';
        sceneContainer.appendChild(characterPanelBtn);
        characterPanelBtn.addEventListener('click', () => {
            const isOpen = this.characterPanel.toggle();
            if (this.cameraController) {
                this.cameraController.setInventoryOpen(isOpen);
            }
        });

        // 清空伤害数字数组
        this.damageNumbers = [];

        // 重置角色状态（但保留装备和背包）
        this.character.reset();
        this.character.setPosition(new THREE.Vector3(0, 1.5, 0));

        // 更新UI以显示保留的装备和背包
        if (this.inventoryUI) {
            this.inventoryUI.update();
        }
        if (this.characterPanel) {
            this.characterPanel.update();
        }

        // 设置返回按钮事件
        const backButton = levelPage.querySelector('.back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.backToMain();
            });
        }

        this.currentLevel = levelNum;
        this.isRunning = true;
        this.levelCompleted = false; // 重置完成标志

        // 防止页面滚动
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';

        // 开始游戏循环
        this.gameLoop();
    }

    gameLoop() {
        if (!this.isRunning) return;

        this.animationId = requestAnimationFrame(() => this.gameLoop());

        if (!this.character || !this.cameraController || !this.renderer) return;

        // 处理移动
        this.handleMovement();

        // 更新关卡（宝藏动画、怪物移动等）
        const characterPosition = this.character.getPosition();
        const scene = this.levelManager.sceneManager.getScene();

        // 更新怪物（包括仇恨和攻击）
        for (const monster of this.levelManager.monsters) {
            if (monster.isAlive) {
                monster.update(
                    characterPosition,
                    this.levelManager.collisionDetector,
                    this.character,
                    scene,
                    this.damageNumbers,
                    (scene, position, damage, isHeal) => new DamageNumber(scene, position, damage, isHeal),
                    this.cloneSystem // 传递cloneSystem以便怪物攻击分身
                );
            }
        }

        // 更新Boss
        if (this.levelManager.boss && this.levelManager.boss.isAlive) {
            // 将damageNumbers和createDamageNumber传递给Boss的update，以便在爆炸时显示伤害
            const bossUpdateOptions = {
                damageNumbers: this.damageNumbers,
                createDamageNumber: (scene, position, damage, isHeal) => new DamageNumber(scene, position, damage, isHeal),
                cloneSystem: this.cloneSystem // 传递cloneSystem以便Boss攻击分身
            };
            this.levelManager.boss.update(
                characterPosition,
                this.levelManager.collisionDetector,
                this.character,
                scene,
                this.damageNumbers,
                (scene, position, damage, isHeal) => new DamageNumber(scene, position, damage, isHeal),
                bossUpdateOptions
            );
        }

        // 更新小Boss
        for (const miniBoss of this.levelManager.miniBosses) {
            if (miniBoss.isAlive) {
                miniBoss.update(
                    characterPosition,
                    this.levelManager.collisionDetector,
                    this.character,
                    scene,
                    this.damageNumbers,
                    (scene, position, damage, isHeal) => new DamageNumber(scene, position, damage, isHeal),
                    this.cloneSystem // 传递cloneSystem以便小Boss攻击分身
                );
            }
        }

        // 更新其他关卡内容
        this.levelManager.update(characterPosition);

        // 更新技能系统
        if (this.skillSystem) {
            this.skillSystem.update();

            // 更新技能UI
            if (this.gameUI) {
                this.gameUI.updateSkillCooldowns({
                    clone: this.skillSystem.getCooldown('clone'),
                    dragonTiger: this.skillSystem.getCooldown('dragonTiger')
                });
            }
        }

        // 更新分身系统
        if (this.cloneSystem && this.cameraController) {
            const direction = this.cameraController.getForwardDirection();
            this.cloneSystem.update(
                characterPosition,
                direction,
                this.levelManager.collisionDetector,
                (scene, position, damage, isHeal, isCrit) => new DamageNumber(scene, position, damage, isHeal, isCrit),
                this.damageNumbers
            );
        }

        // 更新伤害数字
        this.damageNumbers = this.damageNumbers.filter(damageNum => damageNum.update());

        // 更新角色血条UI
        if (this.characterHealthUI) {
            this.characterHealthUI.update();
        }

        // 更新相机
        this.cameraController.update(characterPosition);

        // 更新角色朝向，使其跟随相机朝向
        if (this.character && this.cameraController) {
            const yRotation = this.cameraController.getYRotation();
            this.character.setRotation(yRotation);
        }

        // 检查角色是否死亡
        if (!this.character.isAlive && this.isRunning) {
            this.onCharacterDeath();
            return;
        }

        // 检查宝藏收集
        this.checkTreasureCollection();

        // 检查是否所有怪兽都被击败
        this.checkLevelComplete();

        // 渲染场景
        if (scene) {
            this.renderer.render(scene, this.cameraController.camera);
        }
    }

    handleMovement() {
        if (!this.character || !this.cameraController || !this.physicsEngine) return;

        // 使用相机控制器的方法获取方向向量
        const direction = this.cameraController.getForwardDirection();
        const right = this.cameraController.getRightDirection();

        // 更新物理引擎
        const newPosition = this.physicsEngine.update(
            this.character.group,
            this.keys,
            direction,
            right,
            this.character.moveSpeed,
            this.character.jumpPower
        );

        this.character.setPosition(newPosition);
    }

    checkTreasureCollection() {
        // 检查普通宝藏
        const treasure = this.levelManager.treasure;
        if (treasure && !treasure.collected) {
            const characterPosition = this.character.getPosition();
            const isInRange = treasure.isInRange(characterPosition, 3);

            // 显示/隐藏提示
            this.gameUI.showTreasureHint(isInRange);

            // 按住F收集
            if (isInRange && this.keys['f']) {
                const result = this.levelManager.collectTreasure(this.inventory, treasure);
                if (result && result.count > 0) {
                    this.gameUI.showTreasureHint(false);
                    if (this.inventoryUI) {
                        this.inventoryUI.update();
                    }
                } else if (this.inventory.isFull()) {
                    this.gameUI.showInventoryFullHint();
                }
            }
        }

        // 检查Boss掉落的宝藏
        if (this.levelManager.boss && this.levelManager.boss.treasure) {
            const bossTreasure = this.levelManager.boss.treasure;
            if (!bossTreasure.collected) {
                const characterPosition = this.character.getPosition();
                const isInRange = bossTreasure.isInRange(characterPosition, 3);

                // 显示/隐藏提示
                this.gameUI.showTreasureHint(isInRange);

                // 按住F收集
                if (isInRange && this.keys['f']) {
                    const result = this.levelManager.collectTreasure(this.inventory, bossTreasure);
                    if (result && result.count > 0) {
                        this.gameUI.showTreasureHint(false);
                        if (this.inventoryUI) {
                            this.inventoryUI.update();
                        }
                    } else if (this.inventory.isFull()) {
                        this.gameUI.showInventoryFullHint();
                    }
                }
            }
        }
    }

    useItem(index) {
        const effect = this.inventory.useItem(index);
        if (effect) {
            this.character.applyEffect(effect);
            if (this.inventoryUI) {
                this.inventoryUI.update();
            }
        }
    }

    deleteItem(index) {
        this.inventory.removeItem(index);
        if (this.inventoryUI) {
            this.inventoryUI.update();
        }
    }

    /**
     * 从背包装备物品
     * @param {number} index 物品索引
     */
    equipItemFromInventory(index) {
        const item = this.inventory.getItem(index);
        if (!item || !item.isEquipment) {
            return;
        }

        // 装备物品
        const oldEquipment = this.character.equipItem(item);

        // 如果原来有装备，放回背包
        if (oldEquipment) {
            // 如果背包满了，先移除当前物品
            if (this.inventory.isFull()) {
                this.inventory.removeItem(index);
                this.inventory.addItem(oldEquipment);
            } else {
                // 背包没满，直接添加旧装备
                this.inventory.addItem(oldEquipment);
                this.inventory.removeItem(index);
            }
        } else {
            // 没有旧装备，直接移除当前物品
            this.inventory.removeItem(index);
        }

        // 更新UI
        if (this.inventoryUI) {
            this.inventoryUI.update();
        }
        if (this.characterPanel) {
            this.characterPanel.update();
        }
    }

    /**
     * 卸下装备
     * @param {string} slot 装备槽位
     * @param {Item} equipment 装备物品
     */
    unequipItem(slot, equipment) {
        if (!equipment) return;

        // 卸下装备
        this.character.unequipItem(slot);

        // 放回背包
        if (this.inventory.addItem(equipment)) {
            // 更新UI
            if (this.inventoryUI) {
                this.inventoryUI.update();
            }
            if (this.characterPanel) {
                this.characterPanel.update();
            }
        } else {
            // 背包满了，无法卸下
            console.log('背包已满，无法卸下装备！');
            // 重新装备回去
            this.character.equipItem(equipment);
        }
    }

    /**
     * 创建小Boss
     * @param {THREE.Vector3} position 位置
     * @param {number} levelNum 关卡编号
     * @param {THREE.Scene} scene 场景
     */
    async createMiniBoss(position, levelNum, scene) {
        console.log(`Game.createMiniBoss 被调用，位置: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);
        await this.levelManager.createMiniBoss(position, levelNum, scene);
        console.log(`Game.createMiniBoss 完成`);
    }

    /**
     * Boss死亡时掉落物品
     * @param {number} levelNum 关卡编号
     */
    dropBossLoot(levelNum) {
        // 掉落一个武器到背包
        const weapon = Item.createBossWeapon(levelNum);
        if (this.inventory.addItem(weapon)) {
            console.log(`获得武器：${weapon.name}`);
            if (this.inventoryUI) {
                this.inventoryUI.update();
            }
        } else {
            console.log('背包已满，无法获得武器！');
            this.gameUI.showInventoryFullHint();
        }

        // 掉落三种药水并直接使用
        const potions = [
            { name: '加速药水', icon: '⚡' },
            { name: '弹跳药水', icon: '🦘' },
            { name: '回血药水', icon: '❤️' }
        ];

        potions.forEach(potionInfo => {
            const potion = new Item(
                `boss_potion_${potionInfo.name}_${Date.now()}`,
                potionInfo.name,
                levelNum
            );

            // 直接使用药水
            const effect = potion.use();
            if (effect) {
                if (effect.type === 'heal') {
                    // 回血药水：恢复50%最大血量
                    const healAmount = Math.floor(this.character.maxHealth * 0.5);
                    this.character.heal(healAmount);
                    console.log(`使用${potionInfo.name}，恢复${healAmount}点血量！`);
                } else {
                    // 其他药水效果
                    this.character.applyEffect(effect);
                    console.log(`使用${potionInfo.name}！`);
                }
            }
        });
    }

    handleResize() {
        if (this.renderer) {
            this.renderer.updateSize();
        }
        if (this.cameraController) {
            this.cameraController.updateAspect();
        }
    }

    cleanupLevel() {
        this.isRunning = false;
        this.levelCompleted = false; // 重置完成标志

        // 恢复页面滚动
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.cameraController) {
            this.cameraController.dispose();
            this.cameraController = null;
        }

        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }

        if (this.levelManager) {
            this.levelManager.dispose();
        }

        if (this.character) {
            this.character.clearEffects();
        }

        if (this.physicsEngine) {
            this.physicsEngine.reset();
            this.physicsEngine = null;
        }

        if (this.inventoryUI) {
            this.inventoryUI.dispose();
            this.inventoryUI = null;
        }

        if (this.characterHealthUI) {
            this.characterHealthUI.dispose();
            this.characterHealthUI = null;
        }

        // 清理伤害数字
        for (const damageNum of this.damageNumbers) {
            damageNum.dispose();
        }
        this.damageNumbers = [];

        // 清理分身系统
        if (this.cloneSystem) {
            this.cloneSystem.clear();
            this.cloneSystem = null;
        }

        // 清理技能系统
        this.skillSystem = null;

        this.gameUI.dispose();
        this.keys = {};
    }

    backToMain() {
        this.cleanupLevel();

        // 关闭胜利界面和失败界面
        if (this.gameUI) {
            this.gameUI.closeVictory();
            this.gameUI.closeFailure();
        }

        // 移除关卡页面
        const levelPage = document.querySelector('.level-page');
        if (levelPage) {
            levelPage.remove();
        }

        // 更新关卡选择器状态（显示新解锁的关卡）
        if (this.levelSelector) {
            this.levelSelector.updateLevelStatus();
        }

        // 显示主界面
        this.levelSelector.show();
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('开始初始化游戏...');
        // 确保THREE已加载
        if (typeof THREE === 'undefined') {
            throw new Error('THREE.js未加载，请检查网络连接');
        }
        window.game = new Game();
        console.log('游戏初始化完成');
    } catch (error) {
        console.error('游戏初始化失败:', error);
        console.error('错误堆栈:', error.stack);
        // 显示错误信息给用户
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = `
                <div style="padding: 20px; text-align: center; color: red;">
                    <h1>游戏加载失败</h1>
                    <p>错误信息: ${error.message}</p>
                    <p>请检查浏览器控制台获取更多信息</p>
                    <p style="margin-top: 20px; color: #666;">
                        提示：如果使用ES6模块，请使用本地服务器运行项目<br>
                        Python: python -m http.server 8000<br>
                        Node.js: npx http-server
                    </p>
                    <pre style="text-align: left; background: #f5f5f5; padding: 10px; margin-top: 20px; overflow: auto;">
${error.stack}
                    </pre>
                </div>
            `;
        }
    }
});

