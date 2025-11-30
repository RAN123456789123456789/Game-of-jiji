/**
 * 碰撞检测器
 */
import { GameConfig } from '../config/GameConfig.js';

export class CollisionDetector {
    constructor(collidableObjects) {
        this.collidableObjects = collidableObjects;
    }

    /**
     * 更新可碰撞物体列表
     */
    updateCollidableObjects(collidableObjects) {
        this.collidableObjects = collidableObjects;
    }

    /**
     * 检查碰撞
     * @param {THREE.Vector3} position - 位置
     * @returns {boolean}
     */
    checkCollision(position) {
        const playerRadius = GameConfig.character.playerRadius;
        const playerHeight = GameConfig.character.playerHeight;

        // 创建玩家的碰撞盒
        const playerBox = new THREE.Box3(
            new THREE.Vector3(
                position.x - playerRadius,
                position.y,
                position.z - playerRadius
            ),
            new THREE.Vector3(
                position.x + playerRadius,
                position.y + playerHeight,
                position.z + playerRadius
            )
        );

        // 检查与所有可碰撞物体的碰撞
        for (let obj of this.collidableObjects) {
            // 更新碰撞盒
            obj.box.setFromObject(obj.mesh);

            if (playerBox.intersectsBox(obj.box)) {
                return true; // 发生碰撞
            }
        }

        return false; // 无碰撞
    }

    /**
     * 检查位置是否有效（不与碰撞物体重叠）
     * @param {THREE.Vector3} position - 位置
     * @param {number} radius - 半径
     * @returns {boolean}
     */
    isValidPosition(position, radius = 0.5) {
        const testBox = new THREE.Box3(
            new THREE.Vector3(
                position.x - radius,
                position.y - radius,
                position.z - radius
            ),
            new THREE.Vector3(
                position.x + radius,
                position.y + radius,
                position.z + radius
            )
        );

        for (let obj of this.collidableObjects) {
            obj.box.setFromObject(obj.mesh);
            if (testBox.intersectsBox(obj.box)) {
                return false;
            }
        }

        return true;
    }
}


