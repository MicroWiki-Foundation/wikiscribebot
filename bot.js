const { mwn } = require('mwn');
require('dotenv').config();

const DeduplicateRequests = require('./tasks/drafts/deduplicate_requests');
const UpdateDraftTemplates = require('./tasks/drafts/update_draft_templates');
const ReplaceCategory = require('./tasks/categories/replace_category');
const AutoRejectDrafts = require('./tasks/drafts/autoreject_drafts');
const fetch = require('node-fetch');

globalThis.fetch = fetch;

(async () => {
    const bot = await mwn.init({
        apiUrl: process.env.API_URI,
    
        // Can be skipped if the bot doesn't need to sign in
        username: process.env.BOT_USERNAME,
        password: process.env.BOT_PASSWORD,
    
        // Set your user agent (required for WMF wikis, see https://meta.wikimedia.org/wiki/User-Agent_policy):
        userAgent: 'WikiScribeBot',
    
        // Set default parameters to be sent to be included in every API request
        defaultParams: {
            assert: 'user' // ensure we're logged in
        }
    });

    let tasks = [
        new DeduplicateRequests(bot),
        new UpdateDraftTemplates(bot),
        new AutoRejectDrafts(bot)
    ];

    // todo - create task report for the Wiki?

    for (let j of tasks) {
        await j.run();
    }
})();
