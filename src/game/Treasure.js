/**
 * 宝藏类
 */
export class Treasure {
    constructor(levelNum, position) {
        this.levelNum = levelNum;
        this.position = position;
        this.collected = false;
        this.mesh = null;
        this.star = null;
    }

    /**
     * 创建宝藏3D对象
     * @returns {Object} {treasure, star}
     */
    createMesh() {
        // 创建宝藏（宝箱）
        const treasureGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.8);
        const treasureMaterial = new THREE.MeshPhongMaterial({
            color: 0xffd700,
            emissive: 0xffd700,
            emissiveIntensity: 0.3
        });
        this.mesh = new THREE.Mesh(treasureGeometry, treasureMaterial);
        this.mesh.position.copy(this.position);
        this.mesh.userData = { collected: false, level: this.levelNum };

        // 创建星星（浮动在宝藏上方）
        const starGeometry = new THREE.OctahedronGeometry(0.3, 0);
        const starMaterial = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });
        this.star = new THREE.Mesh(starGeometry, starMaterial);
        this.star.position.copy(this.position);
        this.star.position.y += 1.2;

        return {
            treasure: this.mesh,
            star: this.star
        };
    }

    /**
     * 更新星星动画
     */
    updateStar() {
        if (this.star && this.mesh && !this.collected) {
            // 上下浮动
            this.star.position.y = this.mesh.position.y + 1.2 + Math.sin(Date.now() * 0.003) * 0.3;
            // 旋转
            this.star.rotation.y += 0.02;
            this.star.rotation.x += 0.01;
        }
    }

    /**
     * 检查是否在收集范围内
     * @param {THREE.Vector3} characterPosition 
     * @param {number} distance 
     * @returns {boolean}
     */
    isInRange(characterPosition, distance = 3) {
        if (!this.mesh || this.collected) return false;
        return characterPosition.distanceTo(this.mesh.position) < distance;
    }

    /**
     * 收集宝藏
     * @returns {boolean} 是否收集成功
     */
    collect() {
        if (this.collected) return false;
        this.collected = true;
        if (this.mesh) this.mesh.visible = false;
        if (this.star) this.star.visible = false;
        return true;
    }

    /**
     * 清理资源
     */
    dispose() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        if (this.star) {
            this.star.geometry.dispose();
            this.star.material.dispose();
        }
    }
}


