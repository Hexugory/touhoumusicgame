import { Message, PermissionFlagsBits, PermissionResolvable, StageChannel, TextChannel, VoiceChannel } from "discord.js";
import { TMQClient } from "../tmqclient";
import { StringArgument } from "../types/string";
import { Command } from "./command";

interface StartGameArguments {
    repeat?: string
}

export class StartGameCommand implements Command {
	name = 'startgame'
    aliases = ['start']
    description = 'Starts the music quiz'
    usage = ''
    permission = [PermissionFlagsBits.Administrator]
    guildOnly = true
    ownerOnly = false
    args = [
        {
            key: 'repeat',
            type: StringArgument,
            infinite: false,
            optional: true
        }
    ]

	async execute(msg: Message, arglist: {}) {
        const client = msg.client as TMQClient;
        const args = arglist as StartGameArguments;
        const lobby = client.lobbies.get(msg.guildId!);

        if (!(msg.channel instanceof StageChannel)) return msg.reply("you're not in a stage channel!");

        if (!lobby) {
            msg.reply('creating lobby...');
            return client.createLobby(msg.guild!, msg.channel, !!args.repeat); //ha
        }
        else {
            msg.reply('restarting game...');
            lobby?.game.endGame();
            lobby.startGame();
        }
	}
};
