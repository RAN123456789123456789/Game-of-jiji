/**
 * 游戏进度管理
 * 管理关卡解锁状态
 */
export class GameProgress {
    constructor() {
        this.storageKey = 'game_progress';
        this.progress = this.loadProgress();
    }

    /**
     * 加载进度
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // 确保第一关始终解锁
                parsed.unlockedLevels = parsed.unlockedLevels || [1];
                if (!parsed.unlockedLevels.includes(1)) {
                    parsed.unlockedLevels.push(1);
                }
                return parsed;
            }
        } catch (error) {
            console.warn('加载游戏进度失败:', error);
        }

        // 默认：只有第一关解锁
        return {
            unlockedLevels: [1],
            completedLevels: []
        };
    }

    /**
     * 保存进度
     */
    saveProgress() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
        } catch (error) {
            console.warn('保存游戏进度失败:', error);
        }
    }

    /**
     * 检查关卡是否解锁
     * @param {number} levelNum 
     * @returns {boolean}
     */
    isLevelUnlocked(levelNum) {
        return this.progress.unlockedLevels.includes(levelNum);
    }

    /**
     * 解锁关卡
     * @param {number} levelNum 
     */
    unlockLevel(levelNum) {
        if (!this.progress.unlockedLevels.includes(levelNum)) {
            this.progress.unlockedLevels.push(levelNum);
            this.progress.unlockedLevels.sort((a, b) => a - b);
            this.saveProgress();
        }
    }

    /**
     * 完成关卡
     * @param {number} levelNum 
     */
    completeLevel(levelNum) {
        if (!this.progress.completedLevels.includes(levelNum)) {
            this.progress.completedLevels.push(levelNum);
            this.saveProgress();
        }

        // 解锁下一关
        const nextLevel = levelNum + 1;
        if (nextLevel <= 6) { // 假设最多6关
            this.unlockLevel(nextLevel);
        }
    }

    /**
     * 检查关卡是否完成
     * @param {number} levelNum 
     * @returns {boolean}
     */
    isLevelCompleted(levelNum) {
        return this.progress.completedLevels.includes(levelNum);
    }

    /**
     * 获取所有解锁的关卡
     * @returns {Array<number>}
     */
    getUnlockedLevels() {
        return [...this.progress.unlockedLevels];
    }

    /**
     * 重置进度（用于测试）
     */
    resetProgress() {
        this.progress = {
            unlockedLevels: [1],
            completedLevels: []
        };
        this.saveProgress();
    }
}


