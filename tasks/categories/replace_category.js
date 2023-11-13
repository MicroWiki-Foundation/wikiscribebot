const Task = require('../task');

class ReplaceCategory extends Task
{
    /**
     *Creates an instance of Task.
     * @param {mwn} bot
     * @memberof Task
     */
     constructor(bot, originalCategory, targetCategory) {
        super(bot);
        this.originalCategory = originalCategory;
        this.targetCategory = targetCategory;
    }

    async run() {
        const pages = await this.bot.getPagesInCategory(this.originalCategory);

        return this.bot.batchOperation(
            pages,
            (page, idx) => {
                return this.bot.edit(page, (rev) => {
                    let text = rev.content;

                    if (!this.targetCategory) {
                        text = text.replace(`[[Category:${this.originalCategory}]]`, '');
                        text = text.replace(`[[Category: ${this.originalCategory}]]`, '');
                        text = text.replace(`[[:Category:${this.originalCategory}]]`, '');
                    } else {
                        text = text.replace(`[[Category:${this.originalCategory}]]`, `[[Category:${this.targetCategory}]]`);
                        text = text.replace(`[[Category: ${this.originalCategory}]]`, `[[Category:${this.targetCategory}]]`);
                        text = text.replace(`[[:Category:${this.originalCategory}]]`, `[[:Category:${this.targetCategory}]]`);
                    }
        
                    return {
                        text: text,
                        summary: `Replacing category ${this.originalCategory} -> ${this.targetCategory}`,
                        minor: true
                    };
                });
            },
            /* concurrency */ 5,
            /* retries */ 2
        );
    }
}

module.exports = ReplaceCategory;