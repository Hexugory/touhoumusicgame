import { Message, PermissionResolvable, TextChannel, VoiceChannel } from "discord.js";
import { TMQClient } from "../tmqclient";
import { Command } from "./command";

export class StartPerpetualGameCommand implements Command {
	name = 'startperpetualgame'
    aliases = ['startperpetual', 'start2']
    description = 'Starts the music quiz forever'
    usage = ''
    permission: PermissionResolvable[] = ['ADMINISTRATOR']
    guildOnly = true
    ownerOnly = false
    args = []

	async execute(msg: Message) {
        const client = msg.client as TMQClient;
        if (client.autoRestartGame) return client.endGame();
        client.startGame();
        client.autoRestartGame = true;
	}
};
