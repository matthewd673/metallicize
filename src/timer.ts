class Timer {
    private startTime: number;
    private endTime: number;
    private elapsedTime: number;

    constructor() {
        this.startTime = 0;
        this.endTime = 0;
        this.elapsedTime = 0;
    }

    start = () => {
        this.startTime = new Date().getTime();
    }

    stop = () => {
        this.endTime = new Date().getTime();
        this.elapsedTime = this.endTime - this.startTime;
    }

    ms = () => {
        return this.elapsedTime;
    }

    s = () => {
        return this.elapsedTime / 1000;
    }

}

export { Timer }