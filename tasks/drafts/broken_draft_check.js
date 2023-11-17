const Task = require('../task');

class BrokenDraftCheck extends Task
{
    async run(page, content) {

        if (!content) {
            content = (await this.bot.read('Draft:' + page)).revisions[0].content;
        }

        const html = await this.bot.parseWikitext(content);

        const brokenDraftSmells = [
            '{{Infobox',
            '[[Category:'
        ];

        const results = [];

        for (const smell of brokenDraftSmells) {
            if (html.indexOf(smell) !== -1) {
                results.push('<nowiki>' + smell + '</nowiki>');
                console.log('Broken draft smell detected for ' + page + ' (' + smell + ')');
            }
        }

        return results;
    }
}

module.exports = BrokenDraftCheck;