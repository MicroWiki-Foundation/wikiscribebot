const Task = require('../task');

class UpdateDraftTemplates extends Task
{
    run() {
        return new Promise(async (resolve) => {
            const submissions = await this.bot.read('MicroWiki:Draft review');
            const text = submissions.revisions[0].content;
            const regex = /\[\[Draft:(.*)\|(.*)]]/g;
            let match;

            while ((match = regex.exec(text)) != null) {
                try {
                    await this.bot.edit('Draft:' + match[1].trim(), (rev) => {
                        let text = rev.content;

                        text = rev.content.replace('{{Draft submission|t', '{{Draft submission');

                        return {
                            text: text,
                            summary: 'Marking draft as submitted for review.',
                            minor: true
                        };
                    });
                } catch (e) {
                    console.log(e);
                    console.log('' + match[1]);
                }
            }

            resolve();
        });
    }
}

module.exports = UpdateDraftTemplates;