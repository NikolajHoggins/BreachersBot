import {
    CommandInteraction,
    Client,
    ApplicationCommandType,
    EmbedBuilder,
    ApplicationCommandOptionType,
    PermissionFlagsBits,
} from 'discord.js';
import { Command } from '../../Command';
import Player from '../../models/player.schema';
import { isUserMod } from '../../helpers/permissions';

export const Notes: Command = {
    name: 'notes',
    description: 'Get player notes',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: [PermissionFlagsBits.ManageMessages],
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'user',
            description: 'User to check',
            required: true,
        },
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        const mention = interaction.options.get('user')?.user;

        if (!mention) return interaction.reply({ content: 'no mention', ephemeral: true });

        const isMod = await isUserMod(client, interaction);
        if (!isMod) return;
        const player = await Player.findOne({ discordId: mention.id });
        if (!player) return interaction.reply({ content: 'no player', ephemeral: true });
        if (!player.notes || player.notes.length === 0)
            return interaction.reply({ content: 'no notes', ephemeral: true });

        const embeds = [];
        for (let i = 0; i < player.notes.length; i += 10) {
            const notesSlice = player.notes.slice(i, i + 10);
            const embed = new EmbedBuilder()
                .setTitle(`${mention.username} notes`)
                .setColor('#0099ff')
                .setThumbnail(mention.avatarURL())
                .addFields({
                    name: `Notes - ${notesSlice.length}`,
                    value: notesSlice
                        .map(
                            note =>
                                `<@${note.modId}> - <t:${Math.floor(note.time / 1000)}:F> - ${
                                    note.note
                                }`
                        )
                        .join('\n'),
                });
            embeds.push(embed);
        }

        interaction.reply({
            embeds,
            ephemeral: true,
        });
    },
};
