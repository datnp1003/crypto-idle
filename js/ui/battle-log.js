export class BattleLog {
    constructor(element) {
        this.element = element;
        this.logs = [];
        this.maxLogs = 100;
    }
    
    add(message, type = '') {
        this.logs.push({ message, type, timestamp: Date.now() });
        
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        this.render();
    }
    
    render() {
        if (!this.element) return;
        
        this.element.innerHTML = this.logs
            .map(log => `<p class="${log.type}">${log.message}</p>`)
            .join('');
        
        this.element.scrollTop = this.element.scrollHeight;
    }
    
    clear() {
        this.logs = [];
        this.render();
    }
}