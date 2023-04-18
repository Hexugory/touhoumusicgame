import { ApplicationCommandOptionData, ApplicationCommandOptionType, CommandInteraction, PermissionFlagsBits, StageChannel } from "discord.js"
import { TMQClient } from "../tmqclient"
import { SlashCommand } from "./slash"

export class EndGameCommand implements SlashCommand {
	name = 'endgame'
    description = 'Ends the music quiz'
    permission = [PermissionFlagsBits.ManageChannels]
    ownerOnly = false
    guildOnly = true
    args: ApplicationCommandOptionData[] = []

	async execute(int: CommandInteraction) {
        const client = int.client as TMQClient;
        const lobby = client.lobbies.get(int.guildId!);

        if (!lobby) return int.reply({ content: "there's no game ongoing!", ephemeral: true });

        lobby.destroyLobby();
        return int.reply("the game is over!");
	}
};
