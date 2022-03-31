import { Message, PermissionResolvable, TextChannel, VoiceChannel } from "discord.js";
import { TMQClient } from "../tmqclient";
import { Command } from "./command";

export class StartGameCommand implements Command {
	name = 'startgame'
    aliases = ['start']
    description = 'Starts the music quiz'
    usage = ''
    permission: PermissionResolvable[] = ['ADMINISTRATOR']
    guildOnly = true
    ownerOnly = false
    args = []

	async execute(msg: Message) {
        const client = msg.client as TMQClient;
        client.startGame();
	}
};
