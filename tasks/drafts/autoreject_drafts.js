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

            const rejectDraft = async (pageName, reason) => {
                await this.bot.edit('Draft:' + pageName, (rev) => {
                    let text = rev.content;

                    text = rev.content.replace('{{Draft submission|', `{{Draft submission|d|${reason}. This action was performed by a bot.`);
                    
                    const webhookText = `❌ Draft [${pageName}](https://micronations.wiki/wiki/Draft:${encodeURIComponent(pageName)}) was automatically rejected: ${reason}.`;

                    hookOne.send(webhookText).catch((e) => {
                        console.log(e);
                    });

                    hookTwo.send(webhookText).catch((e) => {
                        console.log(e);
                    });

                    return {
                        text: text,
                        summary: `Autorejecting draft, reason: ${reason}.`,
                        minor: true
                    };
                });
            };

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
                        await rejectDraft(pageName, `Page is too similar to the nation page guide (similarity: ${sim.toFixed(3)})`);
                        continue;
                    }

                    if (pageText.length < 450) {
                        await rejectDraft(pageName, 'Page is shorter than 450 characters');
                        continue;
                    }

                    const exampleTexts = [
                        'Subject of my article',
                        'Use this guide with common sense and read it thoroughly',
                        'Republic of Example',
                        '{region}',
                        '{Head of state}',
                        '{Head of government}',
                        '{Legislature}',
                        '[[Category:{short name of micronation}]]',
                        '[[Category:Micronations in {country}]]',
                        '[[Category:Micronations in {state or other subdivision, if applicable, otherwise do not include this category}]]',
                        '[[Category:Micronations established in {year}]]'
                    ];

                    for (const exampleText of exampleTexts) {
                        let rejected = false;
                        if (pageText.indexOf(exampleText) !== -1) {
                            await rejectDraft(pageName, `Page contains placeholder text (${exampleText.substring(0, 20)}...).`);
                            rejected = true;
                            break;
                        }

                        if (rejected) {
                            continue;
                        }
                    }

                    

                    //
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