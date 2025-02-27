import {
    CommandInteraction,
    Client,
    ApplicationCommandType,
    ApplicationCommandOptionType,
    PermissionFlagsBits,
} from 'discord.js';
import { Command } from '../../Command';
import Player from '../../models/player.schema';
import { getGuild } from '../../helpers/guild';
import { getConfig } from '../../services/system.service';
import { RanksType } from '../../types/channel';
import { botLog } from '../../helpers/messages';
import { isUserMod } from '../../helpers/permissions';

export const GiveElo: Command = {
    name: 'give_elo',
    description: 'Give elo to a player',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: [PermissionFlagsBits.ManageMessages],
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'user',
            description: 'User to give Elo',
            required: true,
        },
        {
            type: ApplicationCommandOptionType.Number,
            name: 'elo',
            description: 'Elo to give',
            required: true,
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'reason',
            description: 'Reason for giving elo',
            required: true,
        },
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        const { user } = interaction;
        const mention = interaction.options.get('user')?.user;
        const elo = interaction.options.get('elo')?.value;
        const reason = interaction.options.get('reason')?.value;

        if (!elo) return interaction.reply({ content: 'no elo' });
        if (!mention) return interaction.reply({ content: 'no mention' });

        const isMod = await isUserMod(client, interaction);
        if (!isMod) return;

        const player = await Player.findOne({ discordId: mention.id });
        if (!player) return interaction.reply({ content: `User not found` });

        await Player.updateOne(
            { discordId: mention.id },
            {
                $inc: { rating: elo },
                $push: {
                    ratingHistory: {
                        rating: player.rating + parseInt(elo as string),
                        date: Date.now(),
                        reason: reason,
                    },
                },
            }
        );

        botLog({
            messageContent: `<@${user.id}> gave <@${mention.id}> ${elo} elo \nReason: ${reason}`,
            client,
        });

        interaction.reply({
            content: `Done`,
            ephemeral: true,
        });
    },
};
