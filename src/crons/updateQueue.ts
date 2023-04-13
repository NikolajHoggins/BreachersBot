import { ActivityType, Client } from 'discord.js';
import cron from 'node-cron';
import Queue, { IQueue } from '../models/queue.schema';
import * as queueService from '../services/queue.service';

export const updateStatus = async (client: Client) => {
    if (!client.user) return;

    const now = Date.now();
    const expired = await Queue.find({ expires: { $lt: now } });
    for (const i in expired) {
        const user = await client.users?.fetch(expired[i].discordId);

        await user.send('Your queue has expired');
        console.log('sent dm to user', user.username, 'queue expired');
    }
    await Queue.deleteMany({ expires: { $lt: now } });
    const queue = await queueService.get();
    await client.user.setActivity(`${queue.length} players in queue`, {
        type: ActivityType.Watching,
    });
};

const initStatusCron = async (client: Client) => {
    cron.schedule('* * * * *', async () => {
        updateStatus(client);
    });
};
export default initStatusCron;
