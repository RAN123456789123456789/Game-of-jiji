/**
 * 角色血条UI组件
 * 显示在游戏界面左上角
 */
export class CharacterHealthUI {
    constructor(container, character) {
        this.container = container;
        this.character = character;
        this.init();
    }

    init() {
        this.render();
    }

    render() {
        const healthPercent = this.character.getHealthPercent();
        const currentHealth = this.character.currentHealth;
        const maxHealth = this.character.maxHealth;

        this.container.innerHTML = `
            <div class="character-health-container">
                <div class="character-avatar">👤</div>
                <div class="character-health-bar-wrapper">
                    <div class="character-health-bar-bg">
                        <div class="character-health-bar-fill" style="width: ${healthPercent * 100}%"></div>
                    </div>
                    <div class="character-health-text">${currentHealth}/${maxHealth}</div>
                </div>
            </div>
        `;
    }

    update() {
        const healthPercent = this.character.getHealthPercent();
        const currentHealth = this.character.currentHealth;
        const maxHealth = this.character.maxHealth;

        const fillBar = this.container.querySelector('.character-health-bar-fill');
        const healthText = this.container.querySelector('.character-health-text');

        if (fillBar) {
            fillBar.style.width = `${healthPercent * 100}%`;

            // 根据血量改变颜色
            if (healthPercent > 0.6) {
                fillBar.style.background = '#00ff00'; // 绿色
            } else if (healthPercent > 0.3) {
                fillBar.style.background = '#ffff00'; // 黄色
            } else {
                fillBar.style.background = '#ff0000'; // 红色
            }
        }

        if (healthText) {
            healthText.textContent = `${currentHealth}/${maxHealth}`;
        }
    }

    dispose() {
        this.container.innerHTML = '';
    }
}


