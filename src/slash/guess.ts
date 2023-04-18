import { ApplicationCommandOptionData, ApplicationCommandOptionType, AutocompleteInteraction, CommandInteraction } from "discord.js"
import { GameState, SONGS } from "../game"
import { TMQClient } from "../tmqclient"
import { SlashCommand } from "./slash"

interface GuessArguments {
    string: string
}

export class GuessCommand implements SlashCommand {
	name = 'guess'
    description = 'Submits your guess for the current song'
    permission = []
    ownerOnly = false
    guildOnly = true
    args: ApplicationCommandOptionData[] = [
        {
            name: 'guess',
            type: ApplicationCommandOptionType.String,
            description: 'Your guess',
            required: true,
            autocomplete: true
        }
    ]

    async autocomplete(int: AutocompleteInteraction) {
        const guess = (int.options.get('guess')?.value as string | undefined)?.toLowerCase();
        if (typeof guess != 'string' || guess.length < 2) return int.respond([]);

        const matches: {
            name: string
            value: string
        }[] = [];
        SONGS.filter((song) => {
            let value = false;
            for (const name of song.names) {
                if (name.toLowerCase().includes(guess)) {
                    value = true;
                    break;
                }
            }
            return value;
        })
        .sorted((a, b) => {
            if (a.names[0].length !== b.names[0].length) {
                return a.names[0].length - b.names[0].length;
            }
        
            return a.names[0] < b.names[0]? -1 : 1;
        }).forEach(song => {
            if (!matches.find(a => {return a.name === song.names[0]})) {
                return matches.push({
                    name: song.names[0],
                    value: song.names[0]
                })
            };
        });
        matches.length = Math.min(matches.length, 15);

        return int.respond(matches);
    }

	async execute(int: CommandInteraction) {
        const client = int.client as TMQClient;
        const lobby = client.lobbies.get(int.guildId!);

        if (!lobby || !lobby.game) return int.reply({
            content: 'there\'s no game right now!',
            ephemeral: true
        });

        if (lobby.game.state != GameState.Guessing) return int.reply({
            content: 'it\'s not the guess phase!',
            ephemeral: true
        });

        if ((int.options.get('guess')!.value as string).length > 75) return int.reply({
            content: 'your guess is too long!',
            ephemeral: true
        });

        if (!lobby.game.players.get(int.user.id)) {
            lobby.game.players.set(int.user.id, {
                name: int.user.username,
                id: int.user.id,
                score: 0,
                guess: '',
                correct: false
            });
        }

        const player = lobby.game.players.get(int.user.id);
        player!.guess = (int.options.get('guess')!.value as string).toLowerCase();

        if (lobby.game.state === GameState.Guessing) return int.reply({
            content: 'guess sent!',
            ephemeral: true
        });
	}
};
