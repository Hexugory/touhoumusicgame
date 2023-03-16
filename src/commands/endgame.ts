import { Message, PermissionFlagsBits, PermissionResolvable, TextChannel, VoiceChannel } from "discord.js";
import { TMQClient } from "../tmqclient";
import { Command } from "./command";

export class EndGameCommand implements Command {
	name = 'endgame'
    aliases = ['end']
    description = 'Ends the music quiz'
    usage = ''
    permission = [PermissionFlagsBits.Administrator]
    guildOnly = true
    ownerOnly = false
    args = []

	async execute(msg: Message) {
        const client = msg.client as TMQClient;
        const lobby = client.lobbies.get(msg.guildId!);

        if (!lobby) return msg.reply("there's no game ongoing!");

        lobby.game.endGame();
        lobby.destroyLobby();
        return msg.reply("the game is over!");
	}
};
