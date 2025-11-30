/**
 * 游戏UI管理器
 */
import { LevelConfig } from '../config/LevelConfig.js';

export class GameUI {
    constructor() {
        this.levelPage = null;
        this.treasureHint = null;
        this.attackFeedback = null;
        this.victoryModal = null;
        this.failureModal = null;
    }

    /**
     * 创建关卡页面
     * @param {number} levelNum 
     * @returns {HTMLElement}
     */
    createLevelPage(levelNum) {
        const levelConfig = LevelConfig[levelNum];
        if (!levelConfig) {
            throw new Error(`关卡 ${levelNum} 不存在`);
        }

        const levelPage = document.createElement('div');
        levelPage.className = `level-page active level-${this.getLevelClass(levelNum)}`;
        levelPage.innerHTML = `
            <div class="level-header">
                <h1>${levelConfig.icon} 第${levelNum}关：${levelConfig.name}</h1>
            </div>
            <div class="level-content">
                <div class="scene-container">
                    <div id="scene3d"></div>
                    <div class="controls-hint">
                        <p>点击场景开始游戏 | WASD移动 | 鼠标控制视角 | 空格跳跃 | 左键攻击 | B切换背包 | ESC退出</p>
                    </div>
                    <button class="inventory-toggle-btn" id="inventory-toggle-btn" title="打开背包 (B)">
                        <span class="inventory-btn-icon">🎒</span>
                        <span class="inventory-btn-text">背包</span>
                    </button>
                    <div class="skills-bar" id="skills-bar">
                        <div class="skill-item" id="skill-clone" title="分身技能 (1)">
                            <div class="skill-icon">👥</div>
                            <div class="skill-cooldown" id="skill-clone-cooldown">0</div>
                        </div>
                        <div class="skill-item" id="skill-dragon-tiger" title="龙虎拳 (2)">
                            <div class="skill-icon">👊</div>
                            <div class="skill-cooldown" id="skill-dragon-tiger-cooldown">0</div>
                        </div>
                    </div>
                </div>
                <div class="character-info">
                    <div class="character-name">吉吉</div>
                </div>
                <div class="level-description">
                    ${levelConfig.description}
                </div>
                <button class="back-button">返回主界面</button>
            </div>
        `;

        this.levelPage = levelPage;
        return levelPage;
    }

    /**
     * 显示宝藏提示
     * @param {boolean} show 
     * @param {string} message 
     */
    showTreasureHint(show, message = '按住 F 收集宝藏') {
        if (show) {
            if (!this.treasureHint) {
                this.treasureHint = document.createElement('div');
                this.treasureHint.id = 'treasure-hint';
                this.treasureHint.className = 'treasure-hint';
                const sceneContainer = document.querySelector('.scene-container');
                if (sceneContainer) {
                    sceneContainer.appendChild(this.treasureHint);
                }
            }
            this.treasureHint.textContent = message;
            this.treasureHint.style.display = 'block';
        } else {
            if (this.treasureHint) {
                this.treasureHint.style.display = 'none';
            }
        }
    }

    /**
     * 显示背包已满提示
     */
    showInventoryFullHint() {
        this.showTreasureHint(true, '背包已满！');
        if (this.treasureHint) {
            this.treasureHint.style.background = 'rgba(255, 0, 0, 0.9)';
            setTimeout(() => {
                this.showTreasureHint(false);
                if (this.treasureHint) {
                    this.treasureHint.style.background = '';
                }
            }, 2000);
        }
    }

    /**
     * 获取关卡CSS类名
     */
    getLevelClass(levelNum) {
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

    /**
     * 显示攻击反馈
     */
    showAttackFeedback(hitCount) {
        if (!this.attackFeedback) {
            this.attackFeedback = document.createElement('div');
            this.attackFeedback.id = 'attack-feedback';
            this.attackFeedback.className = 'attack-feedback';
            const sceneContainer = document.querySelector('.scene-container');
            if (sceneContainer) {
                sceneContainer.appendChild(this.attackFeedback);
            }
        }

        this.attackFeedback.textContent = `命中 ${hitCount} 个目标！`;
        this.attackFeedback.style.display = 'block';
        this.attackFeedback.style.opacity = '1';

        // 淡出效果
        setTimeout(() => {
            if (this.attackFeedback) {
                this.attackFeedback.style.transition = 'opacity 0.5s';
                this.attackFeedback.style.opacity = '0';
                setTimeout(() => {
                    if (this.attackFeedback) {
                        this.attackFeedback.style.display = 'none';
                    }
                }, 500);
            }
        }, 1000);
    }

    /**
     * 显示胜利界面
     * @param {number} levelNum 
     */
    showVictory(levelNum) {
        // 如果已经显示，不重复显示
        if (this.victoryModal) return;

        const nextLevel = levelNum + 1;
        const hasNextLevel = nextLevel <= 6;

        this.victoryModal = document.createElement('div');
        this.victoryModal.className = 'victory-modal';
        this.victoryModal.innerHTML = `
            <div class="victory-content">
                <h1>🎉 恭喜通关！</h1>
                <p class="victory-message">你成功完成了第${levelNum}关！</p>
                ${hasNextLevel ? `<p class="unlock-message">第${nextLevel}关已解锁！</p>` : '<p class="unlock-message">恭喜完成所有关卡！</p>'}
                <div class="victory-buttons">
                    <button class="victory-button" id="continue-btn">继续游戏</button>
                    <button class="victory-button" id="back-to-menu-btn">返回主菜单</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.victoryModal);

        // 绑定按钮事件
        const continueBtn = this.victoryModal.querySelector('#continue-btn');
        const backBtn = this.victoryModal.querySelector('#back-to-menu-btn');

        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.closeVictory();
            });
        }

        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.closeVictory();
                // 触发返回主菜单事件
                const event = new CustomEvent('backToMain');
                window.dispatchEvent(event);
            });
        }
    }

    closeVictory() {
        if (this.victoryModal) {
            this.victoryModal.remove();
            this.victoryModal = null;
        }
    }

    /**
     * 显示失败界面
     * @param {Function} onRestart 重新开始回调
     * @param {Function} onBackToMain 返回主菜单回调
     */
    showFailure(onRestart, onBackToMain) {
        // 如果已经显示，不重复显示
        if (this.failureModal) return;

        this.failureModal = document.createElement('div');
        this.failureModal.className = 'failure-modal';
        this.failureModal.innerHTML = `
            <div class="failure-content">
                <h1>💀 任务失败</h1>
                <p class="failure-message">你的血量归零了！</p>
                <div class="failure-buttons">
                    <button class="failure-button" id="restart-btn">重新开始</button>
                    <button class="failure-button" id="back-to-main-btn">返回首页</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.failureModal);

        // 绑定按钮事件
        const restartBtn = this.failureModal.querySelector('#restart-btn');
        const backBtn = this.failureModal.querySelector('#back-to-main-btn');

        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.closeFailure();
                if (onRestart) {
                    onRestart();
                }
            });
        }

        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.closeFailure();
                if (onBackToMain) {
                    onBackToMain();
                }
            });
        }
    }

    closeFailure() {
        if (this.failureModal) {
            this.failureModal.remove();
            this.failureModal = null;
        }
    }

    /**
     * 清理UI
     */
    dispose() {
        if (this.treasureHint) {
            this.treasureHint.remove();
            this.treasureHint = null;
        }
        if (this.attackFeedback) {
            this.attackFeedback.remove();
            this.attackFeedback = null;
        }
        if (this.victoryModal) {
            this.victoryModal.remove();
            this.victoryModal = null;
        }
        if (this.failureModal) {
            this.failureModal.remove();
            this.failureModal = null;
        }
        if (this.levelPage) {
            this.levelPage.remove();
            this.levelPage = null;
        }
    }

    /**
     * 更新技能冷却时间显示
     * @param {Object} cooldowns 冷却时间对象 {clone: 秒数, dragonTiger: 秒数}
     */
    updateSkillCooldowns(cooldowns) {
        const cloneCooldown = document.getElementById('skill-clone-cooldown');
        const dragonTigerCooldown = document.getElementById('skill-dragon-tiger-cooldown');
        const cloneItem = document.getElementById('skill-clone');
        const dragonTigerItem = document.getElementById('skill-dragon-tiger');

        if (cloneCooldown && cooldowns.clone !== undefined) {
            const seconds = Math.ceil(cooldowns.clone);
            cloneCooldown.textContent = seconds > 0 ? seconds : '';
            if (cloneItem) {
                cloneItem.classList.toggle('on-cooldown', seconds > 0);
            }
        }

        if (dragonTigerCooldown && cooldowns.dragonTiger !== undefined) {
            const seconds = Math.ceil(cooldowns.dragonTiger);
            dragonTigerCooldown.textContent = seconds > 0 ? seconds : '';
            if (dragonTigerItem) {
                dragonTigerItem.classList.toggle('on-cooldown', seconds > 0);
            }
        }
    }
}

