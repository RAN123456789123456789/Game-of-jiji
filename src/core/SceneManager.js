/**
 * 场景管理器
 * 负责创建和管理3D场景
 */
import { GameConfig } from '../config/GameConfig.js';
import { LevelConfig } from '../config/LevelConfig.js';

export class SceneManager {
    constructor() {
        this.scene = null;
        this.collidableObjects = [];
    }

    /**
     * 创建场景
     * @param {number} levelNum - 关卡编号
     * @returns {THREE.Scene}
     */
    createScene(levelNum) {
        const levelConfig = LevelConfig[levelNum];
        if (!levelConfig) {
            throw new Error(`关卡 ${levelNum} 不存在`);
        }

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(levelConfig.backgroundColor);
        this.collidableObjects = [];

        // 创建地面
        this.createGround(levelConfig.groundColor);

        // 根据关卡类型创建场景元素
        this.createLevelElements(levelNum, levelConfig);

        // 添加光源
        this.addLights(levelConfig);

        return this.scene;
    }

    /**
     * 创建地面
     */
    createGround(color) {
        const groundGeometry = new THREE.PlaneGeometry(
            GameConfig.scene.groundSize,
            GameConfig.scene.groundSize
        );
        const groundMaterial = new THREE.MeshPhongMaterial({ color });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        this.scene.add(ground);
    }

    /**
     * 创建关卡元素
     */
    createLevelElements(levelNum, config) {
        const sceneCreators = {
            city: () => this.createCityElements(),
            forest: () => this.createForestElements(),
            desert: () => this.createDesertElements(),
            glacier: () => this.createGlacierElements(),
            mountain: () => this.createMountainElements(),
            hell: () => this.createHellElements()
        };

        const creator = sceneCreators[config.sceneType];
        if (creator) {
            creator();
        }
    }

    /**
     * 创建城市场景元素
     */
    createCityElements() {
        const buildingColors = [0x708090, 0x778899, 0x696969, 0x808080];
        for (let i = 0; i < 20; i++) {
            const width = 1.5 + Math.random() * 1;
            const height = 2 + Math.random() * 4;
            const depth = 1.5 + Math.random() * 1;
            const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
            const buildingMaterial = new THREE.MeshPhongMaterial({
                color: buildingColors[Math.floor(Math.random() * buildingColors.length)]
            });
            const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
            building.position.set(
                -40 + Math.random() * 80,
                height / 2,
                -40 + Math.random() * 80
            );
            this.scene.add(building);
            this.addCollidable(building, { width, height, depth });
        }
    }

    /**
     * 创建森林场景元素
     */
    createForestElements() {
        for (let i = 0; i < 30; i++) {
            const treeGroup = new THREE.Group();
            const trunkRadius = 0.2 + Math.random() * 0.2;
            const trunkHeight = 1.5 + Math.random() * 1.5;
            const crownRadius = 1 + Math.random() * 0.8;

            const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.2, trunkHeight, 8);
            const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = trunkHeight / 2;
            treeGroup.add(trunk);

            const crownGeometry = new THREE.SphereGeometry(crownRadius, 8, 8);
            const crownMaterial = new THREE.MeshPhongMaterial({ color: 0x228b22 });
            const crown = new THREE.Mesh(crownGeometry, crownMaterial);
            crown.position.y = trunkHeight + crownRadius * 0.5;
            treeGroup.add(crown);

            treeGroup.position.set(
                -40 + Math.random() * 80,
                0,
                -40 + Math.random() * 80
            );
            this.scene.add(treeGroup);
            this.addCollidable(treeGroup, {
                width: crownRadius * 2,
                height: trunkHeight + crownRadius * 2,
                depth: crownRadius * 2
            });
        }
    }

    /**
     * 创建沙漠场景元素
     */
    createDesertElements() {
        // 沙丘（不碰撞）
        for (let i = 0; i < 25; i++) {
            const radius = 1.5 + Math.random() * 2;
            const duneGeometry = new THREE.SphereGeometry(radius, 8, 8);
            const duneMaterial = new THREE.MeshPhongMaterial({ color: 0xf4a460 });
            const dune = new THREE.Mesh(duneGeometry, duneMaterial);
            dune.position.set(
                -40 + Math.random() * 80,
                radius * 0.3,
                -40 + Math.random() * 80
            );
            this.scene.add(dune);
        }

        // 仙人掌
        for (let i = 0; i < 20; i++) {
            const radius = 0.2 + Math.random() * 0.2;
            const height = 1 + Math.random() * 1.5;
            const cactusGeometry = new THREE.CylinderGeometry(radius, radius * 1.2, height, 8);
            const cactusMaterial = new THREE.MeshPhongMaterial({ color: 0x228b22 });
            const cactus = new THREE.Mesh(cactusGeometry, cactusMaterial);
            cactus.position.set(
                -40 + Math.random() * 80,
                height / 2,
                -40 + Math.random() * 80
            );
            this.scene.add(cactus);
            this.addCollidable(cactus, { width: radius * 2, height, depth: radius * 2 });
        }
    }

    /**
     * 创建冰川场景元素
     */
    createGlacierElements() {
        // 冰山
        for (let i = 0; i < 20; i++) {
            const width = 1.5 + Math.random() * 2;
            const height = 1.5 + Math.random() * 3;
            const depth = 1.5 + Math.random() * 2;
            const icebergGeometry = new THREE.BoxGeometry(width, height, depth);
            const icebergMaterial = new THREE.MeshPhongMaterial({
                color: 0xf0f8ff,
                transparent: true,
                opacity: 0.9
            });
            const iceberg = new THREE.Mesh(icebergGeometry, icebergMaterial);
            iceberg.position.set(
                -40 + Math.random() * 80,
                height / 2,
                -40 + Math.random() * 80
            );
            this.scene.add(iceberg);
            this.addCollidable(iceberg, { width, height, depth });
        }

        // 冰柱
        for (let i = 0; i < 15; i++) {
            const radius = 0.2 + Math.random() * 0.3;
            const height = 1.5 + Math.random() * 2;
            const icicleGeometry = new THREE.CylinderGeometry(radius, radius * 1.2, height, 8);
            const icicleMaterial = new THREE.MeshPhongMaterial({
                color: 0xe0ffff,
                transparent: true,
                opacity: 0.8
            });
            const icicle = new THREE.Mesh(icicleGeometry, icicleMaterial);
            icicle.position.set(
                -40 + Math.random() * 80,
                height / 2,
                -40 + Math.random() * 80
            );
            this.scene.add(icicle);
            this.addCollidable(icicle, { width: radius * 2, height, depth: radius * 2 });
        }
    }

    /**
     * 创建山地场景元素
     */
    createMountainElements() {
        // 山峰
        for (let i = 0; i < 15; i++) {
            const radius = 1.5 + Math.random() * 2;
            const height = 2 + Math.random() * 4;
            const mountainGeometry = new THREE.ConeGeometry(radius, height, 8);
            const mountainMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 });
            const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
            mountain.position.set(
                -40 + Math.random() * 80,
                height / 2,
                -40 + Math.random() * 80
            );
            this.scene.add(mountain);
            this.addCollidable(mountain, { width: radius * 2, height, depth: radius * 2 });
        }

        // 岩石
        for (let i = 0; i < 25; i++) {
            const width = 0.5 + Math.random() * 1;
            const height = 0.3 + Math.random() * 0.8;
            const depth = 0.5 + Math.random() * 1;
            const rockGeometry = new THREE.BoxGeometry(width, height, depth);
            const rockMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set(
                -40 + Math.random() * 80,
                height / 2,
                -40 + Math.random() * 80
            );
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            this.scene.add(rock);
            this.addCollidable(rock, { width, height, depth });
        }
    }

    /**
     * 创建地狱场景元素
     */
    createHellElements() {
        // 岩浆池（不碰撞）
        for (let i = 0; i < 12; i++) {
            const radius = 1 + Math.random() * 1.5;
            const lavaGeometry = new THREE.SphereGeometry(radius, 8, 8);
            const lavaMaterial = new THREE.MeshPhongMaterial({
                color: 0xff4500,
                emissive: 0xff4500
            });
            const lava = new THREE.Mesh(lavaGeometry, lavaMaterial);
            lava.position.set(
                -40 + Math.random() * 80,
                radius * 0.3,
                -40 + Math.random() * 80
            );
            this.scene.add(lava);
        }

        // 火焰柱
        for (let i = 0; i < 20; i++) {
            const radius = 0.3 + Math.random() * 0.3;
            const height = 1 + Math.random() * 1.5;
            const fireGeometry = new THREE.CylinderGeometry(radius, radius * 1.2, height, 8);
            const fireMaterial = new THREE.MeshPhongMaterial({
                color: 0xff6347,
                emissive: 0xff4500
            });
            const fire = new THREE.Mesh(fireGeometry, fireMaterial);
            fire.position.set(
                -40 + Math.random() * 80,
                height / 2,
                -40 + Math.random() * 80
            );
            this.scene.add(fire);
            this.addCollidable(fire, { width: radius * 2, height, depth: radius * 2 });
        }

        // 岩石
        for (let i = 0; i < 18; i++) {
            const width = 1 + Math.random() * 1.5;
            const height = 0.5 + Math.random() * 1;
            const depth = 1 + Math.random() * 1.5;
            const rockGeometry = new THREE.BoxGeometry(width, height, depth);
            const rockMaterial = new THREE.MeshPhongMaterial({ color: 0x2f2f2f });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set(
                -40 + Math.random() * 80,
                height / 2,
                -40 + Math.random() * 80
            );
            this.scene.add(rock);
            this.addCollidable(rock, { width, height, depth });
        }
    }

    /**
     * 添加光源
     */
    addLights(config) {
        if (config.sceneType === 'desert') {
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
            this.scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffd700, 1);
            directionalLight.position.set(0, 10, 0);
            this.scene.add(directionalLight);
        } else if (config.sceneType === 'hell') {
            const ambientLight = new THREE.AmbientLight(0xff4500, 0.3);
            this.scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xff6347, 0.8);
            directionalLight.position.set(5, 10, 5);
            this.scene.add(directionalLight);
        } else if (config.sceneType === 'glacier') {
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            this.scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xb0e0e6, 0.8);
            directionalLight.position.set(5, 10, 5);
            this.scene.add(directionalLight);
        } else {
            const ambientLight = new THREE.AmbientLight(0xffffff, config.sceneType === 'forest' ? 0.5 : 0.6);
            this.scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, config.sceneType === 'forest' ? 0.7 : 0.8);
            directionalLight.position.set(5, 10, 5);
            this.scene.add(directionalLight);
        }
    }

    /**
     * 添加可碰撞物体
     */
    addCollidable(mesh, size) {
        this.collidableObjects.push({
            mesh,
            box: new THREE.Box3().setFromObject(mesh),
            size
        });
    }

    /**
     * 获取可碰撞物体列表
     */
    getCollidableObjects() {
        return this.collidableObjects;
    }

    /**
     * 获取场景
     */
    getScene() {
        return this.scene;
    }

    /**
     * 清理场景
     */
    dispose() {
        if (this.scene) {
            // 清理场景中的所有对象
            this.scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            this.scene = null;
        }
        this.collidableObjects = [];
    }
}


