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
        console.debug('test');
        const client = msg.client as TMQClient;
        client.game?.endGame();
        console.debug('end game');
        const voiceChannel = msg.client.channels.resolve(env.VOICE_CHANNEL as string) as VoiceChannel;
        const textChannel = msg.client.channels.resolve(env.TEXT_CHANNEL as string) as TextChannel;
        console.debug('resolve channels');
        client.game = new Game(client, voiceChannel, textChannel);
        console.debug('game newed');
	}
};
