const { mwn } = require('mwn');

class Task
{
    /**
     *Creates an instance of Task.
     * @param {mwn} bot
     * @memberof Task
     */
    constructor(bot) {
        this.bot = bot;
    }

    run() {
        return new Promise((resolve) => {
            resolve();
        });
    }
}

module.exports = Task;