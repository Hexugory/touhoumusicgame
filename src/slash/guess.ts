import { CommandInteraction } from "discord.js"
import { SlashCommand } from "./slash"
import { TMQClient } from "../tmqclient"
import { GameState } from "../game"
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums"

interface GuessArguments {
    string: string
}

export class GuessCommand implements SlashCommand {
	name = 'guess'
    description = 'Submits your guess for the current song'
    permission = []
    guildID = '163175631562080256'
    ownerOnly = false
    args = [
        {
            name: 'guess',
            type: 3, //string
            description: 'Your guess',
            required: true
        }
    ]

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

        if (!client.game.players.get(int.user.id)) {
            client.game.players.set(int.user.id, {
                name: int.user.username,
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
