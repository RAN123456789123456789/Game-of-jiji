// 关卡数据
const levels = {
    1: {
        name: '城市',
        icon: '🏙️',
        description: '欢迎来到第一关：城市！吉吉来到了繁华的都市。这里高楼林立，车水马龙。吉吉需要在这个充满现代气息的城市中寻找线索，但要小心隐藏在暗处的危险。街道上人来人往，每个角落都可能藏着秘密。'
    },
    2: {
        name: '森林',
        icon: '🌲',
        description: '欢迎来到第二关：森林！吉吉深入了神秘的森林。这里古树参天，鸟语花香。茂密的树冠遮天蔽日，只有斑驳的阳光透过树叶洒下。吉吉需要在这片原始森林中探索未知的秘密，但要警惕森林中的各种生物和陷阱。'
    },
    3: {
        name: '沙漠',
        icon: '🏜️',
        description: '欢迎来到第三关：沙漠！吉吉踏入了炎热的沙漠。这里黄沙漫天，烈日当空。一望无际的沙丘在风中不断变化形状，就像流动的海洋。吉吉需要穿越这片危险的沙漠，寻找传说中的珍贵宝藏，但要小心沙暴和流沙。'
    },
    4: {
        name: '冰川',
        icon: '❄️',
        description: '欢迎来到第四关：冰川！吉吉来到了冰冷的冰川地带。这里白雪皑皑，冰封千里。巨大的冰山在阳光下闪闪发光，但脚下的冰面随时可能裂开。吉吉需要在这片严寒的冰川中前行，克服低温的考验，找到通往下一关的道路。'
    },
    5: {
        name: '山地',
        icon: '⛰️',
        description: '欢迎来到第五关：山地！吉吉开始攀登陡峭的山峰。这里山峦起伏，云雾缭绕。狭窄的山路蜿蜒向上，每一步都需要小心谨慎。吉吉需要挑战自己的极限，克服高海拔和险峻的地形，最终登顶成功。'
    },
    6: {
        name: '地狱',
        icon: '🔥',
        description: '欢迎来到第六关：地狱！这是最终的挑战！吉吉来到了充满火焰和黑暗的地狱。这里岩浆翻滚，恶魔横行。这是最危险的关卡，吉吉需要拿出所有的勇气和智慧，战胜邪恶的力量，完成最终的使命！'
    }
};

// 全局变量
let scene, camera, renderer, character, animationId;
let keys = {}; // 键盘状态
let baseMoveSpeed = 0.05; // 基础移动速度（降低）
let moveSpeed = 0.05; // 当前移动速度
let jumpPower = 0.15; // 基础弹跳力
let currentJumpPower = 0.15; // 当前弹跳力
let rotationSpeed = 0.05; // 旋转速度
let euler = new THREE.Euler(0, 0, 0, 'XYZ'); // 相机旋转
let velocity = new THREE.Vector3(); // 移动速度向量
let direction = new THREE.Vector3(); // 移动方向
let isPointerLocked = false; // 鼠标锁定状态
let collidableObjects = []; // 可碰撞物体列表
let treasure = null; // 当前关卡的宝藏
let treasureStar = null; // 宝藏上的星星
let inventory = []; // 背包（最多25个物品）
let isGrounded = true; // 是否在地面上
let verticalVelocity = 0; // 垂直速度
let gravity = -0.02; // 重力
let activeEffects = {}; // 激活的道具效果
let contextMenu = null; // 右键菜单
let selectedItemIndex = -1; // 选中的物品索引
let isInventoryOpen = false; // 背包是否打开
let mouseSensitivity = 0.001; // 鼠标灵敏度（类似原神，更平滑）

// 创建女主角（动漫风格，紫色长发，金丝眼镜）
function createCharacter() {
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

    // 紫色长发（多个圆柱体组合）
    const hairColor = 0x8b4c9f; // 紫色
    const hairMaterial = new THREE.MeshPhongMaterial({ color: hairColor });

    // 左侧长发
    for (let i = 0; i < 3; i++) {
        const hairGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.8, 8);
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.set(-0.3 - i * 0.1, 0.9 - i * 0.2, 0);
        hair.rotation.z = -0.3;
        characterGroup.add(hair);
    }

    // 右侧长发
    for (let i = 0; i < 3; i++) {
        const hairGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.8, 8);
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.set(0.3 + i * 0.1, 0.9 - i * 0.2, 0);
        hair.rotation.z = 0.3;
        characterGroup.add(hair);
    }

    // 后脑长发
    const backHairGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.9, 8);
    const backHair = new THREE.Mesh(backHairGeometry, hairMaterial);
    backHair.position.set(0, 0.85, -0.2);
    characterGroup.add(backHair);

    // 金丝眼镜
    const glassesColor = 0xffd700; // 金色
    const glassesMaterial = new THREE.MeshPhongMaterial({ color: glassesColor });

    // 左镜片
    const leftLensGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16);
    const leftLens = new THREE.Mesh(leftLensGeometry, glassesMaterial);
    leftLens.position.set(-0.15, 1.05, 0.35);
    leftLens.rotation.x = Math.PI / 2;
    characterGroup.add(leftLens);

    // 右镜片
    const rightLensGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16);
    const rightLens = new THREE.Mesh(rightLensGeometry, glassesMaterial);
    rightLens.position.set(0.15, 1.05, 0.35);
    rightLens.rotation.x = Math.PI / 2;
    characterGroup.add(rightLens);

    // 眼镜架
    const bridgeGeometry = new THREE.BoxGeometry(0.3, 0.02, 0.02);
    const bridge = new THREE.Mesh(bridgeGeometry, glassesMaterial);
    bridge.position.set(0, 1.05, 0.35);
    characterGroup.add(bridge);

    // 眼镜腿
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

    return characterGroup;
}

// 创建城市场景
function createCityScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // 天蓝色

    collidableObjects = []; // 重置碰撞物体列表

    // 地面（扩大场景）
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    // 创建高楼（多个长方体）并添加碰撞体积
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
        scene.add(building);

        // 添加碰撞体积
        collidableObjects.push({
            mesh: building,
            box: new THREE.Box3().setFromObject(building),
            size: { width, height, depth }
        });
    }

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    return scene;
}

// 创建森林场景
function createForestScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    collidableObjects = [];

    // 地面（绿色，扩大场景）
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x228b22 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // 创建树木（圆柱体树干 + 球体树冠）
    for (let i = 0; i < 30; i++) {
        const treeGroup = new THREE.Group();

        const trunkRadius = 0.2 + Math.random() * 0.2;
        const trunkHeight = 1.5 + Math.random() * 1.5;
        const crownRadius = 1 + Math.random() * 0.8;

        // 树干
        const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.2, trunkHeight, 8);
        const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = trunkHeight / 2;
        treeGroup.add(trunk);

        // 树冠（球体）
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
        scene.add(treeGroup);

        // 添加碰撞体积（使用树冠）
        collidableObjects.push({
            mesh: treeGroup,
            box: new THREE.Box3().setFromObject(treeGroup),
            size: { width: crownRadius * 2, height: trunkHeight + crownRadius * 2, depth: crownRadius * 2 }
        });
    }

    // 光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    return scene;
}

// 创建沙漠场景
function createDesertScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffd700);

    collidableObjects = [];

    // 地面（黄色，扩大场景）
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0xdaa520 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // 创建沙丘（多个球体）
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
        scene.add(dune);
    }

    // 仙人掌（圆柱体）
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
        scene.add(cactus);

        // 添加碰撞体积
        collidableObjects.push({
            mesh: cactus,
            box: new THREE.Box3().setFromObject(cactus),
            size: { width: radius * 2, height, depth: radius * 2 }
        });
    }

    // 光源（强烈的阳光）
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffd700, 1);
    directionalLight.position.set(0, 10, 0);
    scene.add(directionalLight);

    return scene;
}

// 创建冰川场景
function createGlacierScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xb0e0e6);

    collidableObjects = [];

    // 地面（白色/冰面，扩大场景）
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshPhongMaterial({
        color: 0xe0ffff,
        transparent: true,
        opacity: 0.8
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // 创建冰山（多个长方体）
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
        scene.add(iceberg);

        // 添加碰撞体积
        collidableObjects.push({
            mesh: iceberg,
            box: new THREE.Box3().setFromObject(iceberg),
            size: { width, height, depth }
        });
    }

    // 冰柱（圆柱体）
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
        scene.add(icicle);

        // 添加碰撞体积
        collidableObjects.push({
            mesh: icicle,
            box: new THREE.Box3().setFromObject(icicle),
            size: { width: radius * 2, height, depth: radius * 2 }
        });
    }

    // 光源（冷光）
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xb0e0e6, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    return scene;
}

// 创建山地场景
function createMountainScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    collidableObjects = [];

    // 地面（扩大场景）
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x8b7355 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // 创建山峰（多个锥体/圆锥）
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
        scene.add(mountain);

        // 添加碰撞体积
        collidableObjects.push({
            mesh: mountain,
            box: new THREE.Box3().setFromObject(mountain),
            size: { width: radius * 2, height, depth: radius * 2 }
        });
    }

    // 岩石（长方体）
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
        scene.add(rock);

        // 添加碰撞体积
        collidableObjects.push({
            mesh: rock,
            box: new THREE.Box3().setFromObject(rock),
            size: { width, height, depth }
        });
    }

    // 光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    return scene;
}

// 创建地狱场景
function createHellScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0000);

    collidableObjects = [];

    // 地面（暗红色，扩大场景）
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x8b0000 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // 岩浆池（球体，不碰撞）
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
        scene.add(lava);
    }

    // 火焰柱（圆柱体）
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
        scene.add(fire);

        // 添加碰撞体积
        collidableObjects.push({
            mesh: fire,
            box: new THREE.Box3().setFromObject(fire),
            size: { width: radius * 2, height, depth: radius * 2 }
        });
    }

    // 岩石（暗色）
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
        scene.add(rock);

        // 添加碰撞体积
        collidableObjects.push({
            mesh: rock,
            box: new THREE.Box3().setFromObject(rock),
            size: { width, height, depth }
        });
    }

    // 光源（红色/橙色）
    const ambientLight = new THREE.AmbientLight(0xff4500, 0.3);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xff6347, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    return scene;
}

// 初始化3D场景
function initScene(levelNum) {
    // 创建场景
    const sceneFunctions = {
        1: createCityScene,
        2: createForestScene,
        3: createDesertScene,
        4: createGlacierScene,
        5: createMountainScene,
        6: createHellScene
    };

    scene = sceneFunctions[levelNum]();

    // 创建相机（第一人称视角）
    const container = document.getElementById('scene3d');
    camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );

    // 创建主角（第一人称视角中不显示，避免刘海遮挡）
    character = createCharacter();
    character.position.set(0, 1.5, 0); // 主角位置（y=1.5是眼睛高度）
    character.visible = false; // 第一人称视角中隐藏主角模型
    scene.add(character);

    // 设置相机初始位置（第一人称，在主角眼睛位置）
    camera.position.copy(character.position);
    camera.position.y += 0.3; // 稍微高一点，模拟眼睛位置
    euler.set(0, 0, 0); // 重置旋转

    // 重置物理状态
    isGrounded = true;
    verticalVelocity = 0;
    moveSpeed = baseMoveSpeed;
    currentJumpPower = jumpPower;

    // 创建渲染器
    if (renderer) {
        renderer.dispose();
    }
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // 添加鼠标锁定功能（需要在renderer创建后调用）
    setupPointerLock();

    // 添加键盘事件监听（只需要设置一次）
    if (!keys.hasOwnProperty('_initialized')) {
        setupKeyboardControls();
        keys._initialized = true;
    }

    // 创建宝藏
    createTreasure(levelNum);

    // 创建背包UI
    createInventoryUI();

    // 动画循环
    function animate() {
        animationId = requestAnimationFrame(animate);

        // 处理移动
        handleMovement();

        // 更新相机位置和旋转
        updateCamera();

        // 更新宝藏星星动画
        updateTreasureStar();

        renderer.render(scene, camera);
    }
    animate();
}

// 创建宝藏
function createTreasure(levelNum) {
    if (treasure) {
        scene.remove(treasure);
        scene.remove(treasureStar);
    }

    // 宝藏位置（随机但不在碰撞物体内）
    let treasurePos;
    let validPosition = false;
    let attempts = 0;

    while (!validPosition && attempts < 50) {
        treasurePos = new THREE.Vector3(
            -40 + Math.random() * 80,
            0.5,
            -40 + Math.random() * 80
        );

        // 检查是否与碰撞物体重叠
        validPosition = true;
        for (let obj of collidableObjects) {
            obj.box.setFromObject(obj.mesh);
            const treasureBox = new THREE.Box3(
                new THREE.Vector3(treasurePos.x - 0.5, treasurePos.y - 0.5, treasurePos.z - 0.5),
                new THREE.Vector3(treasurePos.x + 0.5, treasurePos.y + 0.5, treasurePos.z + 0.5)
            );
            if (treasureBox.intersectsBox(obj.box)) {
                validPosition = false;
                break;
            }
        }
        attempts++;
    }

    // 创建宝藏（宝箱）
    const treasureGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.8);
    const treasureMaterial = new THREE.MeshPhongMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.3
    });
    treasure = new THREE.Mesh(treasureGeometry, treasureMaterial);
    treasure.position.copy(treasurePos);
    treasure.userData = { collected: false, level: levelNum };
    scene.add(treasure);

    // 创建星星（浮动在宝藏上方）
    const starGeometry = new THREE.OctahedronGeometry(0.3, 0);
    const starMaterial = new THREE.MeshPhongMaterial({
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 0.5
    });
    treasureStar = new THREE.Mesh(starGeometry, starMaterial);
    treasureStar.position.copy(treasurePos);
    treasureStar.position.y += 1.2;
    scene.add(treasureStar);
}

// 更新星星动画
function updateTreasureStar() {
    if (treasureStar && treasure && !treasure.userData.collected) {
        // 上下浮动
        treasureStar.position.y = treasure.position.y + 1.2 + Math.sin(Date.now() * 0.003) * 0.3;
        // 旋转
        treasureStar.rotation.y += 0.02;
        treasureStar.rotation.x += 0.01;
    }
}

// 检查宝藏收集
function checkTreasureCollection() {
    if (!treasure || !character || treasure.userData.collected) return;

    const distance = character.position.distanceTo(treasure.position);

    // 显示提示
    const hintElement = document.getElementById('treasure-hint');
    if (distance < 3) {
        if (!hintElement) {
            const hint = document.createElement('div');
            hint.id = 'treasure-hint';
            hint.className = 'treasure-hint';
            hint.textContent = '按住 F 收集宝藏';
            document.querySelector('.scene-container').appendChild(hint);
        }

        // 按住F收集
        if (keys['f']) {
            collectTreasure();
        }
    } else {
        if (hintElement) {
            hintElement.remove();
        }
    }
}

// 收集宝藏
function collectTreasure() {
    if (treasure.userData.collected) return;

    // 检查背包是否已满
    if (inventory.length >= 25) {
        const hintElement = document.getElementById('treasure-hint');
        if (hintElement) {
            hintElement.textContent = '背包已满！';
            hintElement.style.background = 'rgba(255, 0, 0, 0.9)';
            setTimeout(() => {
                if (hintElement) {
                    hintElement.remove();
                }
            }, 2000);
        }
        return;
    }

    treasure.userData.collected = true;

    // 随机生成道具类型
    const itemTypes = ['加速药水', '弹跳药水'];
    const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];

    // 添加到背包
    inventory.push({
        id: Date.now(),
        name: itemType,
        level: treasure.userData.level,
        used: false
    });

    // 隐藏宝藏和星星
    treasure.visible = false;
    treasureStar.visible = false;

    // 移除提示
    const hintElement = document.getElementById('treasure-hint');
    if (hintElement) {
        hintElement.remove();
    }

    // 更新背包UI
    updateInventoryUI();
}

// 创建背包UI（25个格子）
function createInventoryUI() {
    // 移除旧的背包UI
    const oldInventory = document.getElementById('inventory');
    if (oldInventory) {
        oldInventory.remove();
    }

    const inventoryDiv = document.createElement('div');
    inventoryDiv.id = 'inventory';
    inventoryDiv.className = 'inventory';
    inventoryDiv.style.display = 'none'; // 默认隐藏
    inventoryDiv.innerHTML = `
        <div class="inventory-header">
            <h3>背包 (${inventory.length}/25)</h3>
            <button class="close-inventory" onclick="toggleInventory()">×</button>
        </div>
        <div id="inventory-items" class="inventory-items"></div>
    `;
    document.querySelector('.level-content').appendChild(inventoryDiv);

    updateInventoryUI();
}

// 切换背包显示/隐藏
window.toggleInventory = function () {
    const inventoryDiv = document.getElementById('inventory');
    if (!inventoryDiv) return;

    isInventoryOpen = !isInventoryOpen;

    if (isInventoryOpen) {
        inventoryDiv.style.display = 'block';
        // 打开背包时退出指针锁定
        if (isPointerLocked && document.exitPointerLock) {
            document.exitPointerLock();
        }
    } else {
        inventoryDiv.style.display = 'none';
    }
};

// 更新背包UI（25个格子网格）
function updateInventoryUI() {
    const itemsContainer = document.getElementById('inventory-items');
    if (!itemsContainer) return;

    itemsContainer.innerHTML = '';

    // 更新标题
    const header = document.querySelector('.inventory-header h3');
    if (header) {
        header.textContent = `背包 (${inventory.length}/25)`;
    }

    // 创建25个格子
    for (let i = 0; i < 25; i++) {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'inventory-slot';

        if (i < inventory.length) {
            const item = inventory[i];
            slotDiv.className += ` inventory-item ${item.used ? 'used' : ''}`;
            slotDiv.innerHTML = `
                <span class="item-icon">${item.name === '加速药水' ? '⚡' : '🦘'}</span>
                <span class="item-name">${item.name}</span>
            `;
            slotDiv.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (!item.used) {
                    showContextMenu(e, i);
                }
            });
            // 左键也可以使用
            slotDiv.addEventListener('click', () => {
                if (!item.used) {
                    useItem(i);
                }
            });
        } else {
            slotDiv.className += ' empty-slot';
        }

        itemsContainer.appendChild(slotDiv);
    }
}

// 显示右键菜单
function showContextMenu(event, itemIndex) {
    // 移除旧菜单
    if (contextMenu) {
        contextMenu.remove();
    }

    const item = inventory[itemIndex];
    if (!item || item.used) return;

    selectedItemIndex = itemIndex;

    contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';
    contextMenu.innerHTML = `
        <div class="context-menu-item" onclick="useItem(${itemIndex})">使用</div>
        <div class="context-menu-item" onclick="deleteItem(${itemIndex})">删除</div>
    `;
    document.body.appendChild(contextMenu);

    // 点击其他地方关闭菜单
    setTimeout(() => {
        document.addEventListener('click', closeContextMenu, { once: true });
        document.addEventListener('contextmenu', closeContextMenu, { once: true });
    }, 10);
}

// 关闭右键菜单
function closeContextMenu() {
    if (contextMenu) {
        contextMenu.remove();
        contextMenu = null;
    }
    selectedItemIndex = -1;
}

// 使用道具（全局函数）
window.useItem = function (index) {
    if (index < 0 || index >= inventory.length) return;

    const item = inventory[index];
    if (item.used) {
        console.log('道具已使用');
        return;
    }

    item.used = true;

    // 应用道具效果（修改游戏数据）
    if (item.name === '加速药水') {
        // 如果已经有加速效果，先清除旧的定时器
        if (activeEffects.speedTimer) {
            clearTimeout(activeEffects.speedTimer);
        }

        moveSpeed = baseMoveSpeed * 4; // 速度 × 4
        activeEffects.speed = true;
        console.log('使用加速药水：移动速度提升4倍');

        activeEffects.speedTimer = setTimeout(() => {
            moveSpeed = baseMoveSpeed;
            activeEffects.speed = false;
            activeEffects.speedTimer = null;
            console.log('加速药水效果结束');
        }, 10000); // 10秒效果

    } else if (item.name === '弹跳药水') {
        // 如果已经有弹跳效果，先清除旧的定时器
        if (activeEffects.jumpTimer) {
            clearTimeout(activeEffects.jumpTimer);
        }

        currentJumpPower = jumpPower * 4; // 弹跳力 × 4
        activeEffects.jump = true;
        console.log('使用弹跳药水：弹跳力提升4倍');

        activeEffects.jumpTimer = setTimeout(() => {
            currentJumpPower = jumpPower;
            activeEffects.jump = false;
            activeEffects.jumpTimer = null;
            console.log('弹跳药水效果结束');
        }, 10000); // 10秒效果
    }

    updateInventoryUI();
    closeContextMenu();
};

// 删除道具（全局函数）
window.deleteItem = function (index) {
    if (index < 0 || index >= inventory.length) return;

    inventory.splice(index, 1);
    updateInventoryUI();
    closeContextMenu();
};

// 设置鼠标锁定
function setupPointerLock() {
    if (!renderer || !renderer.domElement) return;

    const canvas = renderer.domElement;

    // 移除旧的事件监听器（如果存在）
    const oldClickHandler = canvas._clickHandler;
    if (oldClickHandler) {
        canvas.removeEventListener('click', oldClickHandler);
    }

    // 点击场景时锁定鼠标
    const clickHandler = () => {
        canvas.requestPointerLock = canvas.requestPointerLock ||
            canvas.mozRequestPointerLock ||
            canvas.webkitRequestPointerLock;

        if (canvas.requestPointerLock) {
            canvas.requestPointerLock();
        }
    };

    canvas.addEventListener('click', clickHandler);
    canvas._clickHandler = clickHandler;

    // 监听指针锁定状态变化
    const pointerlockchange = () => {
        isPointerLocked = document.pointerLockElement === canvas ||
            document.mozPointerLockElement === canvas ||
            document.webkitPointerLockElement === canvas;
    };

    // 移除旧的监听器（如果存在）
    if (document._pointerlockchange) {
        document.removeEventListener('pointerlockchange', document._pointerlockchange);
        document.removeEventListener('mozpointerlockchange', document._pointerlockchange);
        document.removeEventListener('webkitpointerlockchange', document._pointerlockchange);
    }

    document.addEventListener('pointerlockchange', pointerlockchange);
    document.addEventListener('mozpointerlockchange', pointerlockchange);
    document.addEventListener('webkitpointerlockchange', pointerlockchange);
    document._pointerlockchange = pointerlockchange;

    // 鼠标移动控制视角（平滑稳定，类似原神）
    const onMouseMove = (event) => {
        if (!isPointerLocked || !camera || isInventoryOpen) return;

        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        euler.setFromQuaternion(camera.quaternion);
        // 使用更平滑的灵敏度设置
        euler.y -= movementX * mouseSensitivity;
        euler.x -= movementY * mouseSensitivity;

        // 限制垂直视角（类似原神，可以稍微超过90度）
        euler.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, euler.x));
    };

    // 移除旧的鼠标移动监听器（如果存在）
    if (document._onMouseMove) {
        document.removeEventListener('mousemove', document._onMouseMove);
    }

    document.addEventListener('mousemove', onMouseMove);
    document._onMouseMove = onMouseMove;
}

// 设置键盘控制
function setupKeyboardControls() {
    document.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        keys[key] = true;

        // ESC键退出指针锁定
        if (key === 'escape' && isPointerLocked) {
            if (document.exitPointerLock) {
                document.exitPointerLock();
            }
        }

        // B键打开/关闭背包
        if (key === 'b') {
            toggleInventory();
        }
    });

    document.addEventListener('keyup', (event) => {
        keys[event.key.toLowerCase()] = false;
    });
}

// 碰撞检测
function checkCollision(newPos) {
    const playerRadius = 0.4; // 玩家碰撞半径
    const playerHeight = 1.8; // 玩家高度

    // 创建玩家的碰撞盒
    const playerBox = new THREE.Box3(
        new THREE.Vector3(newPos.x - playerRadius, newPos.y, newPos.z - playerRadius),
        new THREE.Vector3(newPos.x + playerRadius, newPos.y + playerHeight, newPos.z + playerRadius)
    );

    // 检查与所有可碰撞物体的碰撞
    for (let obj of collidableObjects) {
        // 更新碰撞盒
        obj.box.setFromObject(obj.mesh);

        if (playerBox.intersectsBox(obj.box)) {
            return true; // 发生碰撞
        }
    }

    return false; // 无碰撞
}

// 处理移动（带碰撞检测和重力）
function handleMovement() {
    if (!character || !camera) return;

    // 处理重力
    if (!isGrounded) {
        verticalVelocity += gravity;
        character.position.y += verticalVelocity;

        // 检查是否落地
        if (character.position.y <= 1.5) {
            character.position.y = 1.5;
            verticalVelocity = 0;
            isGrounded = true;
        }
    }

    // 空格键跳跃
    if (keys[' '] && isGrounded) {
        verticalVelocity = currentJumpPower;
        isGrounded = false;
    }

    velocity.set(0, 0, 0);

    // 获取相机的前方向和右方向
    direction.set(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    direction.normalize();

    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(camera.quaternion);
    right.normalize();

    // W - 前进
    if (keys['w']) {
        velocity.add(direction.clone().multiplyScalar(moveSpeed));
    }
    // S - 后退
    if (keys['s']) {
        velocity.add(direction.clone().multiplyScalar(-moveSpeed));
    }
    // A - 左移
    if (keys['a']) {
        velocity.add(right.clone().multiplyScalar(-moveSpeed));
    }
    // D - 右移
    if (keys['d']) {
        velocity.add(right.clone().multiplyScalar(moveSpeed));
    }

    // 尝试移动X轴
    const newX = character.position.x + velocity.x;
    const testPosX = new THREE.Vector3(newX, character.position.y, character.position.z);
    if (!checkCollision(testPosX)) {
        character.position.x = newX;
    }

    // 尝试移动Z轴
    const newZ = character.position.z + velocity.z;
    const testPosZ = new THREE.Vector3(character.position.x, character.position.y, newZ);
    if (!checkCollision(testPosZ)) {
        character.position.z = newZ;
    }

    // 限制移动范围（扩大场景边界）
    character.position.x = Math.max(-45, Math.min(45, character.position.x));
    character.position.z = Math.max(-45, Math.min(45, character.position.z));

    // 检查宝藏收集
    checkTreasureCollection();
}

// 更新相机
function updateCamera() {
    if (!camera || !character) return;

    // 相机跟随主角位置
    camera.position.x = character.position.x;
    camera.position.z = character.position.z;
    camera.position.y = character.position.y + 0.3; // 眼睛高度

    // 应用旋转
    camera.quaternion.setFromEuler(euler);
}

// 清理场景
function disposeScene() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    // 退出指针锁定
    if (document.exitPointerLock) {
        document.exitPointerLock();
    }

    // 清理宝藏
    if (treasure && scene) {
        scene.remove(treasure);
    }
    if (treasureStar && scene) {
        scene.remove(treasureStar);
    }
    treasure = null;
    treasureStar = null;

    // 清理提示
    const hintElement = document.getElementById('treasure-hint');
    if (hintElement) {
        hintElement.remove();
    }

    // 关闭右键菜单
    closeContextMenu();

    if (renderer) {
        const container = document.getElementById('scene3d');
        if (container && renderer.domElement) {
            container.removeChild(renderer.domElement);
        }
        renderer.dispose();
    }

    // 重置状态
    keys = {};
    isPointerLocked = false;
    collidableObjects = [];
    isGrounded = true;
    verticalVelocity = 0;
    moveSpeed = baseMoveSpeed;
    currentJumpPower = jumpPower;
    // 清除所有道具效果的定时器
    if (activeEffects.speedTimer) {
        clearTimeout(activeEffects.speedTimer);
    }
    if (activeEffects.jumpTimer) {
        clearTimeout(activeEffects.jumpTimer);
    }
    activeEffects = {};
    isInventoryOpen = false;

    scene = null;
    camera = null;
    character = null;
}

// 初始化
document.addEventListener('DOMContentLoaded', function () {
    // 为每个关卡卡片添加点击事件
    const levelCards = document.querySelectorAll('.level-card');
    levelCards.forEach(card => {
        card.addEventListener('click', function () {
            const levelNum = parseInt(this.getAttribute('data-level'));
            showLevel(levelNum);
        });
    });
});

// 显示关卡页面
function showLevel(levelNum) {
    const level = levels[levelNum];

    // 隐藏主界面
    document.querySelector('.container').style.display = 'none';

    // 清理之前的场景
    disposeScene();

    // 创建关卡页面
    const levelPage = document.createElement('div');
    levelPage.className = `level-page active level-${getLevelClass(levelNum)}`;
    levelPage.innerHTML = `
        <div class="level-header">
            <h1>${level.icon} 第${levelNum}关：${level.name}</h1>
        </div>
        <div class="level-content">
            <div class="scene-container">
                <div id="scene3d"></div>
                <div class="controls-hint">
                    <p>点击场景开始游戏 | WASD移动 | 鼠标控制视角 | 空格跳跃 | B打开背包 | ESC退出</p>
                </div>
            </div>
            <div class="character-info">
                <div class="character-name">吉吉</div>
            </div>
            <div class="level-description">
                ${level.description}
            </div>
            <button class="back-button" onclick="backToMain()">返回主界面</button>
        </div>
    `;

    document.body.appendChild(levelPage);

    // 初始化3D场景
    setTimeout(() => {
        initScene(levelNum);
    }, 100);
}

// 获取关卡CSS类名
function getLevelClass(levelNum) {
    const classMap = {
        1: 'city',
        2: 'forest',
        3: 'desert',
        4: 'glacier',
        5: 'mountain',
        6: 'hell'
    };
    return classMap[levelNum] || 'city';
}

// 返回主界面
function backToMain() {
    // 清理场景
    disposeScene();

    // 移除关卡页面
    const levelPage = document.querySelector('.level-page');
    if (levelPage) {
        levelPage.remove();
    }

    // 显示主界面
    document.querySelector('.container').style.display = 'block';
}

// 窗口大小改变时调整渲染器
window.addEventListener('resize', function () {
    if (camera && renderer) {
        const container = document.getElementById('scene3d');
        if (container) {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    }
});
