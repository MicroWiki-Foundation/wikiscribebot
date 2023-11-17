const Task = require('../task');

class DraftNotifyUser extends Task
{
    run(user, page, message) {
        /*
        {{User warning - draft rejected|name|reason}} ~~~~
        */

        console.log('Notifying user ' + user + ' about rejected draft ' + page + ' with message ' + message);

        return (new this.bot.page('User talk:' + user)).newSection(
            `Draft rejected ${page}`,
            `{{subst:User warning - draft rejected|${page}|${message}}}~~~~`,
            { minor: true }
        );
    }
}

module.exports = DraftNotifyUser;