const Task = require('../task');
const similarity = require("string-similarity");
const { Webhook } = require('@hyunsdev/discord-webhook');

const webhookURL = process.env.WEBHOOK_URI_PRIVATE;
const webhookURLPublic = process.env.WEBHOOK_URI_PUBLIC;

const hookOne = new Webhook(webhookURL, 'WikiScribeBot', 'https://micronations.wiki/images/en/images/images/thumb/7/71/Bot_icon.svg/75px-Bot_icon.svg.png');
const hookTwo = new Webhook(webhookURLPublic, 'WikiScribeBot', 'https://micronations.wiki/images/en/images/images/thumb/7/71/Bot_icon.svg/75px-Bot_icon.svg.png');

class AutoRejectDrafts extends Task
{
    run() {
        return new Promise(async (resolve) => {
            const nationPageGuide = await this.bot.read('MicroWiki:MicroProject Copy Edit/Nation page guide');
            let npgText = nationPageGuide.revisions[0].content;
            npgText = npgText.replace('<noinclude>{{nobots}}{{Nation page guide}}<!-- DO NOT INCLUDE THIS ENTIRE LINE--></noinclude>', '').replace(/\s/g, '');

            const submissions = await this.bot.read('MicroWiki:Draft review');
            const text = submissions.revisions[0].content;
            const regex = /\[\[Draft:(.*)\|(.*)]]/g;
            let match;

            while ((match = regex.exec(text)) != null) {
                try {
                    let pageName = match[1].trim();

                    const page = await this.bot.read('Draft:' + pageName);

                    if (!page || !page.revisions || !page.revisions.length) {
                        continue;
                    }

                    let pageText = page.revisions[0].content;

                    if (pageText.indexOf('{{Draft submission|d') >= 0 || pageText.indexOf('{{Draft submission') === -1) {
                        continue;
                    }

                    pageText = pageText.replace('<!--- Important, do not remove this line before article has been created. --->', '');
                    pageText = pageText.replace(/{{Draft submission.*}}/, '');
                    pageText = pageText.replace(/\s/g, '');

                    const sim = similarity.compareTwoStrings(npgText, page.revisions[0].content.replace(/\s/g, ''));

                    if (sim >= 0.85) {
                        await this.bot.edit('Draft:' + pageName, (rev) => {
                            let text = rev.content;
    
                            text = rev.content.replace('{{Draft submission|', `{{Draft submission|d|Page is too similar to the nation page guide, please remove placeholder content and replace it with your information. This action was performed by a bot, reasoning: Dice similarity to Nation Page Guide (${sim.toFixed(3)}).`);
                            
                            const webhookText = `❌ Draft [${pageName}](https://micronations.wiki/wiki/Draft:${encodeURIComponent(pageName)}) was automatically rejected, page is too similar to the nation page guide (sim: ${sim.toFixed(3)}).`;

                            hookOne.send(webhookText).catch((e) => {
                                console.log(e);
                            });

                            hookTwo.send(webhookText).catch((e) => {
                                console.log(e);
                            });

                            return {
                                text: text,
                                summary: `Autorejecting draft, Dice similarity to Nation Page Guide (${sim.toFixed(3)}).`,
                                minor: true
                            };
                        });
                    }
                } catch (e) {
                    console.log(e);
                    console.log('' + match[1]);
                }
            }

            resolve();
        });
    }
}

module.exports = AutoRejectDrafts;