const Task = require('../task');

class WatchDeletion extends Task
{
    async run() {
        const from = ((+new Date()) - (1000 * 60 * 15)) / 1000;

        const response = await this.bot.query({
            'action': 'query',
            'list': 'recentchanges',
            'rcprop': 'title|ids|sizes|flags|user',
            'rclimit': '100',
		    'format': 'json',
            'rcexcludeuser': 'WikiScribeBot',
            'rcstart': Math.floor(from)
        })

        console.log(response.query.recentchanges);
    }
}

module.exports = WatchDeletion;