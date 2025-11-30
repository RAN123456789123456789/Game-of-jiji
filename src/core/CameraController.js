/**
 * 相机控制器
 * 管理第一人称视角相机
 */
import { GameConfig } from '../config/GameConfig.js';

export class CameraController {
    constructor(container) {
        this.container = container;
        this.camera = null;
        this.yRotation = 0; // Y轴旋转角度（弧度），初始不旋转
        this.xRotation = 0; // X轴旋转角度（用于第三视角）
        this.isPointerLocked = false;
        this.isInventoryOpen = false;
        this.cameraMode = 'firstPerson'; // 'firstPerson' 或 'thirdPerson'
        this.targetPosition = new THREE.Vector3(); // 第三视角的目标位置
        this.currentCameraPosition = new THREE.Vector3(); // 第三视角的当前相机位置
        this.init();
    }

    init() {
        this.camera = new THREE.PerspectiveCamera(
            GameConfig.camera.fov,
            this.container.clientWidth / this.container.clientHeight,
            GameConfig.camera.near,
            GameConfig.camera.far
        );
        // setupPointerLock 将在canvas设置后调用
    }

    /**
     * 设置鼠标锁定
     */
    setupPointerLock() {
        const canvas = this.canvas || this.getCanvas();
        if (!canvas) return;

        // 点击场景时锁定鼠标
        const clickHandler = () => {
            const requestPointerLock = canvas.requestPointerLock ||
                canvas.mozRequestPointerLock ||
                canvas.webkitRequestPointerLock;

            if (requestPointerLock) {
                requestPointerLock.call(canvas);
            }
        };

        canvas.addEventListener('click', clickHandler);

        // 监听指针锁定状态变化
        const pointerlockchange = () => {
            this.isPointerLocked = document.pointerLockElement === canvas ||
                document.mozPointerLockElement === canvas ||
                document.webkitPointerLockElement === canvas;
        };

        document.addEventListener('pointerlockchange', pointerlockchange);
        document.addEventListener('mozpointerlockchange', pointerlockchange);
        document.addEventListener('webkitpointerlockchange', pointerlockchange);

        // 鼠标移动控制视角
        const onMouseMove = (event) => {
            if (!this.isPointerLocked || !this.camera || this.isInventoryOpen) return;

            const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

            // 第一人称：只允许左右旋转
            // 第三视角：允许左右和上下旋转
            this.yRotation -= movementX * GameConfig.camera.mouseSensitivity;

            if (this.cameraMode === 'thirdPerson') {
                // 第三视角允许上下旋转，但限制角度
                this.xRotation -= movementY * GameConfig.camera.mouseSensitivity;
                const maxAngle = Math.PI / 6; // 限制上下旋转角度为30度（减小角度）
                this.xRotation = Math.max(-maxAngle, Math.min(maxAngle, this.xRotation));
            }
        };

        document.addEventListener('mousemove', onMouseMove);
    }

    /**
     * 更新相机位置和旋转
     * @param {THREE.Vector3} position - 角色位置
     */
    update(position) {
        if (!this.camera) return;

        if (this.cameraMode === 'firstPerson') {
            // 第一人称视角
            this.camera.position.x = position.x;
            this.camera.position.z = position.z;
            this.camera.position.y = position.y + GameConfig.character.eyeHeight;

            // 使用四元数直接设置Y轴旋转，避免欧拉角转换问题
            this.camera.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yRotation);
        } else {
            // 第三视角
            const config = GameConfig.camera.thirdPerson;

            // 计算相机应该位于的位置（相对于角色的球坐标）
            const distance = config.distance;
            const height = config.height;

            // 计算相机在球坐标系中的位置
            const offsetX = Math.sin(this.yRotation) * Math.cos(this.xRotation) * distance;
            const offsetZ = Math.cos(this.yRotation) * Math.cos(this.xRotation) * distance;
            const offsetY = Math.sin(this.xRotation) * distance + height;

            // 目标位置
            this.targetPosition.set(
                position.x - offsetX,
                position.y + offsetY,
                position.z - offsetZ
            );

            // 平滑插值到目标位置
            const smoothness = config.smoothness;
            this.currentCameraPosition.lerp(this.targetPosition, 1 - smoothness);

            this.camera.position.copy(this.currentCameraPosition);

            // 相机看向角色
            const lookAtPosition = new THREE.Vector3(
                position.x,
                position.y + height * 0.5,
                position.z
            );
            this.camera.lookAt(lookAtPosition);
        }
    }

    /**
     * 获取前方向向量（用于移动计算）
     * @returns {THREE.Vector3}
     */
    getForwardDirection() {
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        direction.y = 0; // 保持水平
        direction.normalize();
        return direction;
    }

    /**
     * 获取右方向向量（用于移动计算）
     * @returns {THREE.Vector3}
     */
    getRightDirection() {
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this.camera.quaternion);
        right.y = 0; // 保持水平
        right.normalize();
        return right;
    }

    /**
     * 更新相机宽高比
     */
    updateAspect() {
        if (this.camera && this.container) {
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
        }
    }

    /**
     * 设置背包打开状态
     */
    setInventoryOpen(isOpen) {
        this.isInventoryOpen = isOpen;
        if (isOpen && this.isPointerLocked && document.exitPointerLock) {
            document.exitPointerLock();
        }
    }

    /**
     * 退出指针锁定
     */
    exitPointerLock() {
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
    }

    /**
     * 获取画布元素
     */
    getCanvas() {
        // 需要从渲染器获取，这里返回null，由外部设置
        return null;
    }

    /**
     * 设置画布元素
     */
    setCanvas(canvas) {
        this.canvas = canvas;
    }

    /**
     * 切换视角模式
     * @param {string} mode - 'firstPerson' 或 'thirdPerson'
     */
    setCameraMode(mode) {
        if (mode === 'firstPerson' || mode === 'thirdPerson') {
            this.cameraMode = mode;

            // 切换视角时重置X旋转
            if (mode === 'firstPerson') {
                this.xRotation = 0;
            }
        }
    }

    /**
     * 切换视角（在第一人称和第三视角之间切换）
     */
    toggleCameraMode() {
        this.setCameraMode(this.cameraMode === 'firstPerson' ? 'thirdPerson' : 'firstPerson');
    }

    /**
     * 获取当前视角模式
     * @returns {string}
     */
    getCameraMode() {
        return this.cameraMode;
    }

    /**
     * 获取Y轴旋转角度（用于角色朝向）
     * @returns {number} Y轴旋转角度（弧度）
     */
    getYRotation() {
        return this.yRotation;
    }

    /**
     * 清理资源
     */
    dispose() {
        this.exitPointerLock();
        this.camera = null;
    }
}

