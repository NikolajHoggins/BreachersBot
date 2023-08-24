import { IMatchPlayer } from '../models/match.schema.js';
import { getGameMaps, getGameTeams } from '../services/system.service.js';

export interface IVotes {
    map: string;
    teamASide: string;
}
export const getVotes = async (matchPlayers: IMatchPlayer[]): Promise<IVotes> => {
    const gameTeams = await getGameTeams();
    const gameMaps = await getGameMaps();

    const defaultMap = gameMaps.map(m => m.name)[0];
    const defaultTeam = gameTeams[0];

    const teamA = matchPlayers.filter(p => p.team === 'a' && p.vote);
    const teamB = matchPlayers.filter(p => p.team === 'b' && p.vote);

    return {
        teamASide: getMostVoted(
            teamA.map(p => p.vote || ''),
            defaultTeam
        ),
        map: getMostVoted(
            teamB.map(p => p.vote || ''),
            defaultMap
        ),
    };
};

const getMostVoted = (votes: string[], fallback: string): string => {
    // Create an object to keep track of the vote count
    // Create an object to keep track of the vote count
    const voteCount: Record<string, number> = {};
    // Iterate through the array of votes
    votes.forEach(vote => {
        if (!vote || vote === '') return;
        // Check if the vote already exists in the voteCount object
        if (voteCount[vote]) {
            // If it does, increment the vote count
            voteCount[vote]++;
        } else {
            // If it doesn't, add the vote to the voteCount object with a count of 1
            voteCount[vote] = 1;
        }
    });

    // Find the vote with the most occurrences
    let mostVoted = null;
    let maxCount = 0;
    Object.keys(voteCount).forEach(vote => {
        if (voteCount[vote] > maxCount) {
            mostVoted = vote;
            maxCount = voteCount[vote];
        } else if (voteCount[vote] === maxCount) {
            // If two votes have equal occurrences, randomly choose one
            if (Math.random() < 0.5) {
                mostVoted = vote;
            }
        }
    });

    return mostVoted || fallback;
};
