/**
 * 伤害数字显示系统
 * 在怪物头上显示伤害数字
 */
export class DamageNumber {
    constructor(scene, position, damage, isHeal = false, isCrit = false) {
        this.scene = scene;
        this.position = position.clone();
        this.damage = damage;
        this.isHeal = isHeal;
        this.isCrit = isCrit;
        this.sprite = null;
        this.lifetime = isCrit ? 1500 : 1000; // 暴击显示时间更长
        this.startTime = Date.now();
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.02,
            isCrit ? 0.08 : 0.05, // 暴击向上移动更快
            (Math.random() - 0.5) * 0.02
        );
        this.createSprite();
    }

    /**
     * 创建伤害数字精灵
     */
    createSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const context = canvas.getContext('2d');

        // 设置文字样式
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        // 根据是治疗还是伤害设置颜色
        if (this.isHeal) {
            context.fillStyle = '#00ff00'; // 绿色表示治疗
            context.strokeStyle = '#000000';
            context.lineWidth = 3;
            context.strokeText(`+${this.damage}`, 64, 32);
            context.fillText(`+${this.damage}`, 64, 32);
        } else {
            if (this.isCrit) {
                // 暴击：金色，更大字体
                context.font = 'bold 56px Arial';
                context.fillStyle = '#ffd700'; // 金色
                context.strokeStyle = '#ff0000';
                context.lineWidth = 4;
                context.strokeText(`-${this.damage} CRIT!`, 64, 32);
                context.fillText(`-${this.damage} CRIT!`, 64, 32);
            } else {
                context.fillStyle = '#ff0000'; // 红色表示伤害
                context.strokeStyle = '#000000';
                context.lineWidth = 3;
                context.strokeText(`-${this.damage}`, 64, 32);
                context.fillText(`-${this.damage}`, 64, 32);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
            depthWrite: false
        });

        this.sprite = new THREE.Sprite(spriteMaterial);
        // 暴击时更大
        this.sprite.scale.set(this.isCrit ? 1.5 : 1, this.isCrit ? 0.75 : 0.5, 1);
        this.sprite.position.copy(this.position);
        this.sprite.position.y += 2; // 在怪物头上方
        this.scene.add(this.sprite);
    }

    /**
     * 更新伤害数字动画
     * @returns {boolean} 是否还在显示
     */
    update() {
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.lifetime;

        if (progress >= 1) {
            this.dispose();
            return false;
        }

        // 向上移动
        this.sprite.position.add(this.velocity);
        this.velocity.y *= 0.95; // 逐渐减速

        // 淡出效果
        this.sprite.material.opacity = 1 - progress;

        return true;
    }

    /**
     * 清理资源
     */
    dispose() {
        if (this.sprite) {
            this.scene.remove(this.sprite);
            this.sprite.material.dispose();
            this.sprite.material.map.dispose();
            this.sprite = null;
        }
    }
}

