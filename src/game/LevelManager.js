/**
 * 关卡管理器
 */
import { LevelConfig } from '../config/LevelConfig.js';
import { SceneManager } from '../core/SceneManager.js';
import { Treasure } from './Treasure.js';
import { Item } from './Item.js';
import { CollisionDetector } from '../physics/CollisionDetector.js';
import { Monster } from './Monster.js';
// Boss延迟导入，避免模块加载时出错

export class LevelManager {
    constructor() {
        this.sceneManager = new SceneManager();
        this.currentLevel = null;
        this.treasure = null;
        this.collisionDetector = null;
        this.monsters = []; // 怪兽列表
        this.boss = null; // Boss
        this.miniBosses = []; // 小Boss列表
    }

    /**
     * 加载关卡
     * @param {number} levelNum 
     * @returns {Promise<Object>} {scene, collisionDetector, treasure, monsters, levelConfig}
     */
    async loadLevel(levelNum) {
        const levelConfig = LevelConfig[levelNum];
        if (!levelConfig) {
            throw new Error(`关卡 ${levelNum} 不存在`);
        }

        this.currentLevel = levelNum;

        // 创建场景
        const scene = this.sceneManager.createScene(levelNum);

        // 创建碰撞检测器
        const collidableObjects = this.sceneManager.getCollidableObjects();
        this.collisionDetector = new CollisionDetector(collidableObjects);

        // 创建宝藏
        const treasurePosition = this.findValidTreasurePosition(collidableObjects);
        this.treasure = new Treasure(levelNum, treasurePosition);
        const { treasure, star } = this.treasure.createMesh();
        scene.add(treasure);
        scene.add(star);

        // 创建怪兽（等待完成）
        await this.createMonsters(scene, collidableObjects, levelNum);

        // 创建Boss（每个关卡一个Boss）
        await this.createBoss(scene, collidableObjects, levelNum);

        return {
            scene,
            collisionDetector: this.collisionDetector,
            treasure: this.treasure,
            monsters: this.monsters,
            boss: this.boss,
            levelConfig
        };
    }

    /**
     * 创建怪兽
     */
    async createMonsters(scene, collidableObjects, levelNum) {
        this.monsters = [];
        const monsterCount = 5; // 每个关卡5只怪兽

        for (let i = 0; i < monsterCount; i++) {
            const position = this.findValidMonsterPosition(collidableObjects);
            const monster = new Monster(`monster_${levelNum}_${i}`, position);
            const monsterModel = await monster.createModel();
            scene.add(monsterModel);
            this.monsters.push(monster);
        }
    }

    /**
     * 创建Boss
     */
    async createBoss(scene, collidableObjects, levelNum) {
        try {
            // 动态导入Boss，避免模块加载时出错
            const { Boss } = await import('./Boss.js');
            const position = this.findValidMonsterPosition(collidableObjects);
            this.boss = new Boss(`boss_${levelNum}`, position, levelNum);
            const bossModel = await this.boss.createModel();
            scene.add(bossModel);
        } catch (error) {
            console.error('创建Boss失败:', error);
            // 如果Boss创建失败，继续游戏但不创建Boss
            this.boss = null;
        }
    }

    /**
     * 查找有效的怪兽位置
     */
    findValidMonsterPosition(collidableObjects) {
        let position;
        let validPosition = false;
        let attempts = 0;
        const tempDetector = new CollisionDetector(collidableObjects);

        while (!validPosition && attempts < 50) {
            position = new THREE.Vector3(
                -35 + Math.random() * 70,
                0.5,
                -35 + Math.random() * 70
            );

            validPosition = tempDetector.isValidPosition(position, 0.6);
            attempts++;
        }

        return position || new THREE.Vector3(10, 0.5, 10);
    }

    /**
     * 查找有效的宝藏位置
     */
    findValidTreasurePosition(collidableObjects) {
        let position;
        let validPosition = false;
        let attempts = 0;
        const tempDetector = new CollisionDetector(collidableObjects);

        while (!validPosition && attempts < 50) {
            position = new THREE.Vector3(
                -40 + Math.random() * 80,
                0.5,
                -40 + Math.random() * 80
            );

            validPosition = tempDetector.isValidPosition(position, 0.5);
            attempts++;
        }

        return position || new THREE.Vector3(0, 0.5, 0);
    }

    /**
     * 收集宝藏并生成道具
     * @param {Inventory} inventory 
     * @param {Treasure} treasure 要收集的宝藏（可选，默认使用关卡宝藏）
     * @returns {Object|null} {count: 添加的道具数量}
     */
    collectTreasure(inventory, treasure = null) {
        const targetTreasure = treasure || this.treasure;
        if (!targetTreasure || targetTreasure.collected) {
            return null;
        }

        targetTreasure.collect();

        // 掉落多个道具（2-4个）
        const itemCount = 2 + Math.floor(Math.random() * 3); // 2-4个道具
        const itemTypes = ['加速药水', '弹跳药水'];
        let addedCount = 0;

        for (let i = 0; i < itemCount; i++) {
            if (inventory.isFull()) {
                break; // 背包满了就停止添加
            }

            const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
            const item = new Item(Date.now() + i, itemType, this.currentLevel);
            if (inventory.addItem(item)) {
                addedCount++;
            }
        }

        return addedCount > 0 ? { count: addedCount } : null;
    }

    /**
     * 更新关卡（更新宝藏动画等，怪物移动在main.js中处理）
     * @param {THREE.Vector3} characterPosition 角色位置
     */
    update(characterPosition) {
        if (this.treasure) {
            this.treasure.updateStar();
        }

        // 更新Boss掉落的宝藏动画
        if (this.boss && this.boss.treasure) {
            this.boss.treasure.updateStar();
        }
    }

    /**
     * 创建小Boss
     * @param {THREE.Vector3} position 位置
     * @param {number} levelNum 关卡编号
     * @param {THREE.Scene} scene 场景
     */
    async createMiniBoss(position, levelNum, scene) {
        try {
            console.log(`LevelManager.createMiniBoss 被调用，位置: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);

            const { Boss } = await import('./Boss.js');
            const miniBossId = `miniboss_${levelNum}_${this.miniBosses.length}`;
            console.log(`创建小Boss实例: ${miniBossId}`);

            const miniBoss = new Boss(miniBossId, position, levelNum, null, true);
            console.log(`小Boss实例创建完成，开始创建模型...`);

            const miniBossModel = await miniBoss.createModel();
            console.log(`小Boss模型创建完成`);

            // 确保位置正确
            miniBoss.setPosition(position);
            console.log(`设置小Boss位置完成`);

            scene.add(miniBossModel);
            console.log(`小Boss模型已添加到场景`);

            this.miniBosses.push(miniBoss);
            console.log(`小Boss已添加到列表，当前小Boss数量: ${this.miniBosses.length}`);
            console.log(`✅ 创建小Boss成功: ${miniBoss.id} 在位置 (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);
        } catch (error) {
            console.error('❌ 创建小Boss失败:', error);
            console.error('错误堆栈:', error.stack);
        }
    }

    /**
     * 获取所有活着的怪兽（包括Boss和小Boss）
     */
    getAliveMonsters() {
        const aliveMonsters = this.monsters.filter(monster => monster.isAlive);
        if (this.boss && this.boss.isAlive) {
            aliveMonsters.push(this.boss);
        }
        // 添加所有活着的小Boss
        const aliveMiniBosses = this.miniBosses.filter(boss => boss.isAlive);
        aliveMonsters.push(...aliveMiniBosses);
        return aliveMonsters;
    }

    /**
     * 清理关卡
     */
    dispose() {
        if (this.treasure) {
            this.treasure.dispose();
            this.treasure = null;
        }

        // 清理所有怪兽
        for (const monster of this.monsters) {
            monster.dispose();
        }
        this.monsters = [];

        // 清理Boss
        if (this.boss) {
            this.boss.dispose();
            this.boss = null;
        }

        // 清理小Boss
        for (const miniBoss of this.miniBosses) {
            miniBoss.dispose();
        }
        this.miniBosses = [];

        this.sceneManager.dispose();
        this.collisionDetector = null;
        this.currentLevel = null;
    }
}

