class Clock {
    private id = null;
    private timer = null;
    private interval = 1000;
    constructor(id) {
        this.id = id;
    }

    private now = () => {
        const $time: HTMLElement = document.getElementById(this.id);
        const now: string = (new Date()).toLocaleString();
        $time.textContent = now;
    }

    tick() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.timer = setInterval(this.now, this.interval);
    }
}

export default Clock;