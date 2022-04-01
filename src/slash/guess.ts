import { ApplicationCommandOptionData, AutocompleteInteraction, CommandInteraction } from "discord.js"
import { SlashCommand } from "./slash"
import { TMQClient } from "../tmqclient"
import { GameState, SONGS } from "../game"

interface GuessArguments {
    string: string
}

export class GuessCommand implements SlashCommand {
	name = 'guess'
    description = 'Submits your guess for the current song'
    permission = []
    guildID = '163175631562080256'
    ownerOnly = false
    args: ApplicationCommandOptionData[] = [
        {
            name: 'guess',
            type: 3, //string
            description: 'Your guess',
            required: true,
            autocomplete: true
        }
    ]

    async autocomplete(int: AutocompleteInteraction) {
        const guess = int.options.get('guess')?.value;
        if (typeof guess != 'string' || guess.length < 2) return int.respond([]);

        const matches = SONGS.filter((song) => {
            let value = false;
            for (const name of song.names) {
                if (name.includes(guess)) {
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
        })
        .map((song) => {
            return {
                name: song.names[0],
                value: song.names[0]
            }
        });
        matches.length = Math.min(matches.length, 15);

        return int.respond(matches);
    }

	async execute(int: CommandInteraction) {
        const client = int.client as TMQClient;

        if (!client.game) return int.reply({
            content: 'there\'s no game right now!',
            ephemeral: true
        });

        if (client.game.state != GameState.Guessing) return int.reply({
            content: 'it\'s not the guess phase!',
            ephemeral: true
        });

        if ((int.options.get('guess')!.value as string).length > 75) return int.reply({
            content: 'your guess is too long!',
            ephemeral: true
        });

        if (!client.game.players.get(int.user.id)) {
            client.game.players.set(int.user.id, {
                name: int.user.username,
                id: int.user.id,
                score: 0,
                guess: '',
                correct: false
            });
        }

        const player = client.game.players.get(int.user.id);
        player!.guess = (int.options.get('guess')!.value as string).toLowerCase();
        if (client.game.currentSong?.names.includes(player!.guess)) player!.correct = true;

        if (client.game.state === GameState.Guessing) return int.reply({
            content: 'guess sent!',
            ephemeral: true
        });
	}
};
