/**
 * 游戏全局配置
 */
export const GameConfig = {
    // 角色配置
    character: {
        baseMoveSpeed: 0.05,
        baseJumpPower: 0.15,
        playerRadius: 0.4,
        playerHeight: 1.8,
        eyeHeight: 0.3,
        gravity: -0.02
    },

    // 相机配置
    camera: {
        fov: 75,
        near: 0.1,
        far: 1000,
        mouseSensitivity: 0.001,
        verticalAngleLimit: Math.PI / 2.2,
        // 第三视角配置
        thirdPerson: {
            distance: 5,        // 相机距离角色的距离
            height: 1.2,        // 相机高度偏移（降低高度）
            smoothness: 0.1     // 相机跟随平滑度（0-1，越小越平滑）
        }
    },

    // 背包配置
    inventory: {
        maxSlots: 25
    },

    // 道具效果配置
    itemEffects: {
        speedPotion: {
            multiplier: 4,
            duration: 10000 // 毫秒
        },
        jumpPotion: {
            multiplier: 4,
            duration: 10000 // 毫秒
        }
    },

    // 场景配置
    scene: {
        groundSize: 100,
        boundary: 45
    },

    // 模型路径配置
    modelPaths: {
        characters: 'assets/models/characters/',
        items: 'assets/models/items/',
        environments: 'assets/models/environments/'
    }
};


