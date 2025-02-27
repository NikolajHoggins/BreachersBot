import {
    CommandInteraction,
    Client,
    ApplicationCommandType,
    ApplicationCommandOptionType,
    PermissionFlagsBits,
} from 'discord.js';
import { capitalize } from 'lodash';
import { Command } from '../../Command';
import { findByChannelId, setScore } from '../../services/match.service';
import { getTeamBName } from '../../helpers/team';
import { MatchStatus } from '../../models/match.schema';
import { isUserMod } from '../../helpers/permissions';

export const ForceSubmit: Command = {
    name: 'force_submit',
    description: 'Force submit in place of a aplyer',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: [PermissionFlagsBits.ManageMessages],
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'captain',
            description: 'Captain to submit as',
            required: true,
        },
        {
            type: ApplicationCommandOptionType.Number,
            name: 'score',
            description: 'rounds won by the players team',
            min_value: 0,
            max_value: 99,
            required: true,
        },
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        const { user, channelId } = interaction;
        const mention = interaction.options.get('captain')?.user;
        const score = interaction.options.get('score')?.value as number;
        if (score === undefined) return interaction.reply({ content: 'provide score' });

        if (!mention) return interaction.reply({ content: 'no mention' });

        const isMod = await isUserMod(client, interaction);
        if (!isMod) return;

        const match = await findByChannelId(channelId);
        if (!match) {
            await interaction.reply({
                ephemeral: true,
                content: 'Command only works in match thread',
            });
            return;
        }

        if (match.status !== MatchStatus.started) {
            await interaction.reply({
                ephemeral: true,
                content: 'Match not in started state',
            });
            return;
        }
        const matchPlayer = match.players.find(p => p.id === mention.id);
        if (!matchPlayer) {
            await interaction.reply({
                ephemeral: true,
                content: 'You are not in this match',
            });
            return;
        }
        if (!matchPlayer.captain) {
            await interaction.reply({
                ephemeral: true,
                content: 'You are not the captain',
            });
            return;
        }

        setScore({
            matchNumber: match.match_number,
            team: matchPlayer.team,
            score: score as number,
            client,
        });

        const teamName =
            matchPlayer.team === 'a'
                ? capitalize(match.teamASide)
                : capitalize(await getTeamBName(match.teamASide));

        const content = `Submitted score ${score} for team ${teamName}`;

        await interaction.reply({
            content,
        });
    },
};
