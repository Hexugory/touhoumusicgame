import { AudioPlayerState, AudioPlayerStatus, createAudioPlayer, createAudioResource, CreateVoiceConnectionOptions, entersState, getVoiceConnection, joinVoiceChannel, JoinVoiceChannelOptions, StreamType, VoiceConnectionStatus } from "@discordjs/voice";
import { Message, TextChannel, VoiceChannel } from "discord.js";
import { TMQClient } from "../tmqclient";
import { Command } from "./command";
import { env } from "process";
import { FFmpeg } from "prism-media";
import { Game } from "../game";

export class TestCommand implements Command {
	name = 'test'
    aliases = []
    description = 'no'
    usage = 'no'
    permission = []
    guildOnly = false
    ownerOnly = true
    args = []

	async execute(msg: Message) {
        msg.client.application!.commands.set([]);
	}
};
