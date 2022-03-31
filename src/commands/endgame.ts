import { Message, PermissionResolvable, TextChannel, VoiceChannel } from "discord.js";
import { TMQClient } from "../tmqclient";
import { Command } from "./command";

export class EndGameCommand implements Command {
	name = 'endgame'
    aliases = ['end']
    description = 'Ends the music quiz'
    usage = ''
    permission: PermissionResolvable[] = ['ADMINISTRATOR']
    guildOnly = true
    ownerOnly = false
    args = []

	async execute(msg: Message) {
        const client = msg.client as TMQClient;
        client.endGame();
	}
};
