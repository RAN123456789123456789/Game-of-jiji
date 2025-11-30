/**
 * 角色界面UI
 * 显示装备、属性和战力
 */
export class CharacterPanel {
    constructor(container, character, inventory, onEquipItem, onUnequipItem) {
        this.container = container;
        this.character = character;
        this.inventory = inventory;
        this.onEquipItem = onEquipItem; // 从背包装备物品的回调
        this.onUnequipItem = onUnequipItem; // 卸下装备的回调
        this.panel = null;
        this.isOpen = false;
        this.createPanel();
    }

    /**
     * 创建角色界面
     */
    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'character-panel';
        this.panel.className = 'character-panel';
        this.panel.style.display = 'none';

        this.panel.innerHTML = `
            <div class="character-panel-header">
                <h2>角色属性</h2>
                <button class="character-panel-close" id="character-panel-close">×</button>
            </div>
            <div class="character-panel-content">
                <div class="character-stats">
                    <div class="stat-item">
                        <span class="stat-label">攻击力:</span>
                        <span class="stat-value" id="stat-attack">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">暴击率:</span>
                        <span class="stat-value" id="stat-crit">0%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">吸血:</span>
                        <span class="stat-value" id="stat-lifesteal">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">魔抗:</span>
                        <span class="stat-value" id="stat-magic-resist">0</span>
                    </div>
                    <div class="stat-item stat-power">
                        <span class="stat-label">战力:</span>
                        <span class="stat-value" id="stat-power">0</span>
                    </div>
                </div>
                <div class="character-equipment">
                    <h3>装备</h3>
                    <div class="equipment-slots">
                        <div class="equipment-slot" data-slot="weapon">
                            <div class="slot-label">武器</div>
                            <div class="slot-content" id="slot-weapon">
                                <div class="slot-empty">⚔️</div>
                            </div>
                        </div>
                        <div class="equipment-slot" data-slot="armor">
                            <div class="slot-label">衣服</div>
                            <div class="slot-content" id="slot-armor">
                                <div class="slot-empty">🛡️</div>
                            </div>
                        </div>
                        <div class="equipment-slot" data-slot="necklace">
                            <div class="slot-label">项链</div>
                            <div class="slot-content" id="slot-necklace">
                                <div class="slot-empty">💎</div>
                            </div>
                        </div>
                        <div class="equipment-slot" data-slot="boots">
                            <div class="slot-label">靴子</div>
                            <div class="slot-content" id="slot-boots">
                                <div class="slot-empty">👢</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.container.appendChild(this.panel);

        // 绑定关闭按钮
        const closeBtn = this.panel.querySelector('#character-panel-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // 绑定装备槽点击事件（用于卸下装备）
        const slots = this.panel.querySelectorAll('.equipment-slot');
        slots.forEach(slot => {
            slot.addEventListener('click', (e) => {
                const slotName = slot.dataset.slot;
                const equipment = this.character.getEquipment(slotName);
                if (equipment && this.onUnequipItem) {
                    this.onUnequipItem(slotName, equipment);
                }
            });
        });

        // 初始更新
        this.update();
    }

    /**
     * 显示角色界面
     */
    show() {
        if (this.panel) {
            this.panel.style.display = 'block';
            this.isOpen = true;
            this.update();
        }
    }

    /**
     * 隐藏角色界面
     */
    hide() {
        if (this.panel) {
            this.panel.style.display = 'none';
            this.isOpen = false;
        }
    }

    /**
     * 切换显示/隐藏
     */
    toggle() {
        if (this.isOpen) {
            this.hide();
        } else {
            this.show();
        }
        return this.isOpen;
    }

    /**
     * 更新界面显示
     */
    update() {
        if (!this.panel || !this.character) return;

        // 更新属性显示
        const stats = this.character.getCombatStats();
        const power = this.character.getCombatPower();

        const attackEl = this.panel.querySelector('#stat-attack');
        const critEl = this.panel.querySelector('#stat-crit');
        const lifestealEl = this.panel.querySelector('#stat-lifesteal');
        const magicResistEl = this.panel.querySelector('#stat-magic-resist');
        const powerEl = this.panel.querySelector('#stat-power');

        if (attackEl) attackEl.textContent = stats.attack || 0;
        if (critEl) critEl.textContent = `${(stats.critRate || 0).toFixed(1)}%`;
        if (lifestealEl) lifestealEl.textContent = stats.lifesteal || 0;
        if (magicResistEl) magicResistEl.textContent = stats.magicResist || 0;
        if (powerEl) powerEl.textContent = power;

        // 更新装备显示
        this.updateEquipmentSlots();
    }

    /**
     * 更新装备槽显示
     */
    updateEquipmentSlots() {
        const slots = ['weapon', 'armor', 'necklace', 'boots'];

        slots.forEach(slotName => {
            const slotEl = this.panel.querySelector(`#slot-${slotName}`);
            if (!slotEl) return;

            const equipment = this.character.getEquipment(slotName);

            if (equipment) {
                // 显示装备
                slotEl.innerHTML = `
                    <div class="equipment-item" title="${equipment.name}">
                        <div class="equipment-icon">${equipment.getIcon()}</div>
                        <div class="equipment-name">${equipment.name}</div>
                        ${equipment.stats ? `
                            <div class="equipment-stats">
                                ${equipment.stats.attack ? `<div>攻击 +${equipment.stats.attack}</div>` : ''}
                                ${equipment.stats.critRate ? `<div>暴击 +${equipment.stats.critRate}%</div>` : ''}
                                ${equipment.stats.lifesteal ? `<div>吸血 +${equipment.stats.lifesteal}</div>` : ''}
                                ${equipment.stats.magicResist ? `<div>魔抗 +${equipment.stats.magicResist}</div>` : ''}
                            </div>
                        ` : ''}
                    </div>
                `;
            } else {
                // 显示空槽
                const slotLabels = {
                    weapon: '⚔️',
                    armor: '🛡️',
                    necklace: '💎',
                    boots: '👢'
                };
                slotEl.innerHTML = `<div class="slot-empty">${slotLabels[slotName]}</div>`;
            }
        });
    }

    /**
     * 清理资源
     */
    dispose() {
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
    }
}


