require('dotenv').config();
const { CronJob } = require('cron');
const { mwn } = require('mwn');

const DeduplicateRequests = require('./tasks/drafts/deduplicate_requests');
const UpdateDraftTemplates = require('./tasks/drafts/update_draft_templates');
const AutoRejectDrafts = require('./tasks/drafts/autoreject_drafts');

const fetch = require('node-fetch');

globalThis.fetch = fetch;

(async () => {
    const bot = await mwn.init({
        apiUrl: process.env.API_URI,
    
        username: process.env.BOT_USERNAME,
        password: process.env.BOT_PASSWORD,
    
        userAgent: 'WikiScribeBot',
    
        defaultParams: {
            assert: 'user' // ensure we're logged in
        }
    });
    
    const job = CronJob.from({
        cronTime: '*/5 * * * *',
        onTick: async function () {
            console.log('Running tasks...');
    
            (async () => {
                const tasks = [
                    new AutoRejectDrafts(bot),
                    new UpdateDraftTemplates(bot),
                    new DeduplicateRequests(bot),
                ];
            
                // todo - create task report for the Wiki?
            
                for (let j of tasks) {
                    await j.run();
                }
            })();
        },
        start: true,
        timeZone: 'UTC'
    });
})();

