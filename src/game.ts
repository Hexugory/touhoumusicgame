import { AudioPlayer, createAudioPlayer, createAudioResource, joinVoiceChannel, StreamType, VoiceConnection } from "@discordjs/voice";
import { BaseGuildVoiceChannel, Collection, DMChannel, Message, MessageEmbed, Snowflake, TextChannel } from "discord.js";
import { FFmpeg } from "prism-media";
import { TMQClient } from "./tmqclient";

interface Song {
    names: string[]
    file: string
    length: number
}

interface Player {
    name: string
    score: number
    guess: string
    correct: boolean
}

export enum GameState {
    Starting,
    Guessing,
    Revealing,
    Ended
}

const FFMPEG_OPUS_ARGUMENTS = [
    '-loglevel',
    '0',
    '-acodec',
    'libopus',
    '-f',
    'opus',
    '-ar',
    '48000',
    '-ac',
    '2',
];

const songs = new Collection<string, Song>();

const SONG_LIST: {
    names: string[]
    file: string
    length: number
}[] = require('../audio/songs.json');

for (const song of SONG_LIST) {
    songs.set(song.names[0], {
        names: song.names,
        file: song.file,
        length: song.length
    });
}



export class Game {
    constructor (client: TMQClient, voiceChannel: BaseGuildVoiceChannel, textChannel: TextChannel) {
        console.debug('constructing game');

        this.connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator
        });

        this.player = createAudioPlayer();
        this.connection.subscribe(this.player);

        this.textChannel = textChannel;

        this.client = client;
        client.on('messageCreate', this.messageCallback.bind(this));

        this.textChannel.send('the game is starting!');
        this.startSong();
    }

    messageCallback (msg: Message) {
        if (!(msg.channel instanceof DMChannel) || msg.author.bot) return;

        if (this.state === GameState.Guessing) {
            if (!this.players.get(msg.author.id)) {
                this.players.set(msg.author.id, {
                    name: msg.author.username,
                    score: 0,
                    guess: '',
                    correct: false
                });
            }

            const player = this.players.get(msg.author.id);
            player!.guess = msg.content.toLowerCase();
            if (this.currentSong?.names.includes(player!.guess)) player!.correct = true;
            msg.react('🗳️');

            return;
        }
    }

    getScores () {
        let scorestr = '';
        this.players.sort((a, b) => {
            return b.score - a.score;
        });
        this.players.forEach((player) => {
            scorestr += `${player.name}: ${player.score}\n`;
        });
        return scorestr;
    }

    startSong () {
        console.debug('start song');
        const embed = new MessageEmbed()
            .setColor(0xfd6b5f);

        console.debug('past new thing');

        if (this.remainingSongs === 0) {
            const scorestr = this.getScores();
            embed.setTitle(`the game is over, thanks for playing!`)
                .setDescription(scorestr);
            this.textChannel.send({ embeds: [embed] });
            this.endGame();
            return;
        }

        this.currentSong = songs.random();
        this.remainingSongs--;
        console.debug(this.currentSong, songs.size);

        const ffmpeg = new FFmpeg({
            args: ['-ss', `${Math.floor(Math.random()*(this.currentSong!.length-30))}`, '-t', '30', '-i', __dirname + '\\..\\audio\\'+ this.currentSong!.file, ...FFMPEG_OPUS_ARGUMENTS]
        });
        const resource = createAudioResource(ffmpeg, { inputType : StreamType.OggOpus });

        this.client.user?.setActivity({
            name: 'guess phase!'
        });
        this
        this.state = GameState.Guessing;
        this.reveal = setTimeout(this.revealSong.bind(this), 20_000);
        this.end = setTimeout(this.startSong.bind(this), 30_000);
        this.player.play(resource);
        
        embed.setTitle(`guess the new song, DM me your answer or use /guess!`);
        this.textChannel.send({ embeds: [embed] });
    }

    revealSong () {
        this.state = GameState.Revealing;
        this.client.user?.setActivity({
            name: 'reveal phase!'
        });

        this.players.forEach((player) => {
            if (player.correct) {
                player.score++;
            }
            player.guess = '';
            player.correct = false;
        });

        const scorestr = this.getScores();
        const embed = new MessageEmbed()
            .setColor(0xfd6b5f)
            .setTitle(`the answer was ${this.currentSong?.names[0]}!`)
            .setDescription(scorestr);
        this.textChannel.send({ embeds: [embed] });
    }

    endGame () {
        this.state = GameState.Ended;
        clearTimeout(this.reveal);
        clearTimeout(this.end);
        this.client.removeListener('messageCreate', this.messageCallback);
        this.client.user?.setActivity();
        this.connection.disconnect();
        this.connection.destroy();
    }

    textChannel: TextChannel
    client: TMQClient
    players = new Collection<Snowflake, Player>();
    connection: VoiceConnection
    player: AudioPlayer
    currentSong?: Song
    remainingSongs = 20
    state = GameState.Starting
    reveal = setTimeout(()=>{},0);
    end = setTimeout(()=>{},0);
}