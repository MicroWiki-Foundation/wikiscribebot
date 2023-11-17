const Task = require('../task');
const notifyTask = require('./notify_user');

class DeduplicateRequests extends Task
{
    run() {
        const fnIsDraftRequestReviewed = async (page) => {
            const content = await this.bot.read('Draft:' + page);

            if (!content || !content.revisions) {
                return {
                    resolved: false,
                    rejected: false
                }
            }

            return {
                resolved: content.revisions[0].content.indexOf('{{Draft submission|t') >= 0,
                rejected: content.revisions[0].content.indexOf('{{Draft submission|d') >= 0
            };
        };

        const fnIsDraftRequestRejected = async (page) => {
            const content = await this.bot.read('Draft:' + page);

            if (!content || !content.revisions) {
                return true;
            }

            return content.revisions[0].content.indexOf('{{Draft submission|d') >= 0;
        };

        return this.bot.edit('MicroWiki:Draft review', async (rev) => {
            let text = rev.content;
            
            // remove comments - they serve no purpose here
            text = text.replace(/\n<!-- Simply save the template as-is, and make sure you do not remove any brackets nor the tildes above! -->/g, '');

            class DraftRequest 
            {
                constructor(title, text) {
                    this.title = title;
                    this.text = text;
                }
            }

            let requests = [];
            let previousMatch = null;
            const reg = /==\s?Draft review r.* for (.*)\s?==/g;
            let match;

            while ((match = reg.exec(text)) != null) {
                if (!previousMatch) {
                    previousMatch = match;
                    continue;
                }

                let subtext = text.substring(previousMatch["index"], match["index"]);

                const title = previousMatch[1];

                requests.push(new DraftRequest(title, subtext));
                previousMatch = match;
            }

            if (previousMatch) {
                requests.push(new DraftRequest(previousMatch[1], text.substring(previousMatch["index"])));
            }

            const requested = {};
            let duplicates = {};

            for (let j = 0; j < requests.length; j++) {
                const rq = requests[j];

                const {resolved, rejected} = await fnIsDraftRequestReviewed(rq.title);
                
                if (rq.title.toLowerCase() in requested || resolved || rejected) {
                    text = text.replace(rq.text, '');
                    if (!duplicates[rq.title]) {
                        duplicates[rq.title] = 1;
                    } else {
                        duplicates[rq.title]++;
                    }
                }

                if (rejected) {
                    try {
                        const user = await (new this.bot.page('Draft:' + rq.title).getCreator())
                        await (new notifyTask(this.bot)).run(user, rq.title, 'Your draft has been rejected automatically by a bot.');
                    } catch (e) {
                        console.log('Failed to notify');
                    }
                }

                requested[rq.title.toLowerCase()] = true;
            }

            let editSummary = [];

            for (let j of Object.keys(duplicates)) {
                editSummary.push(j + ": " + duplicates[j]);
            }
        
            return {
                text: text,
                summary: 'Removing duplicate and resolved draft requests: ' + editSummary.join(', '),
                minor: true
            };
        });
    }
}

module.exports = DeduplicateRequests;