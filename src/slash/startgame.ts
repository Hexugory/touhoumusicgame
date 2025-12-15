import { ApplicationCommandOptionData, ApplicationCommandOptionType, ChatInputCommandInteraction, PermissionFlagsBits, StageChannel } from "discord.js"
import { TMQClient } from "../tmqclient"
import { SlashCommand } from "./slash"

export class StartGameCommand implements SlashCommand {
	name = 'startgame'
    description = 'Starts the music quiz'
    permission = [PermissionFlagsBits.ManageChannels]
    ownerOnly = false
    guildOnly = true
    args: ApplicationCommandOptionData[] = [
        {
            name: 'restart',
            type: ApplicationCommandOptionType.Boolean,
            description: 'Whether to automatically restart',
            required: false
        }
    ]

	async execute(int: ChatInputCommandInteraction) {
        const client = int.client as TMQClient;
        const lobby = client.lobbies.get(int.guildId!);

        if (!(int.channel instanceof StageChannel)) return int.reply({ content: "you're not in a stage channel!", ephemeral: true });

        if (!lobby) {
            int.reply({ content: "creating lobby...", ephemeral: true })
            return client.createLobby(int.guild!, int.channel, !!int.options.get('restart')?.value); //ha
        }
        else {
            int.reply({ content: "restarting game...", ephemeral: true })
            lobby.startGame();
        }
	}
};
