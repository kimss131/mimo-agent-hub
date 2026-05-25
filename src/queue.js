class TaskQueue {
    constructor({ concurrency = 5 }) {
        this.concurrency = concurrency;
        this.running = 0;
        this.queue = [];
    }

    async add(fn) {
        if (this.running >= this.concurrency) {
            await new Promise(resolve => this.queue.push(resolve));
        }
        this.running++;
        try {
            return await fn();
        } finally {
            this.running--;
            if (this.queue.length > 0) {
                this.queue.shift()();
            }
        }
    }

    get size() {
        return this.queue.length;
    }

    get active() {
        return this.running;
    }
}

module.exports = { TaskQueue };
