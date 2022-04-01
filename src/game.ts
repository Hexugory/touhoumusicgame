import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, joinVoiceChannel, StreamType, VoiceConnection } from "@discordjs/voice";
import { BaseGuildVoiceChannel, Collection, DMChannel, Message, MessageEmbed, Snowflake, StageChannel, TextChannel } from "discord.js";
import { FFmpeg } from "prism-media";
import { Scores } from "./models/scores";
import { TMQClient } from "./tmqclient";

interface Song {
    names: string[]
    file: string
    length: number
}

interface SongGuessRates {
    [key: string]: {
        appeared: number
        correct: number
    }
}

interface Player {
    name: string
    id: string
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

export const SONGS = new Collection<string, Song>();

const SONG_LIST: {
    names: string[]
    file: string
    length: number
}[] = require('../audio/songs.json');

for (const song of SONG_LIST) {
    SONGS.set(song.names[0], {
        names: song.names,
        file: song.file,
        length: song.length
    });
}

function cleanFormatting (string: string) {
    return string.replace(/(\`|\n)/g, '');
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
        this.player.on(AudioPlayerStatus.Playing, () => {
            if (voiceChannel.guild.me!.voice.channel instanceof StageChannel) voiceChannel.guild.me!.voice.setSuppressed(false);
        });
        this.connection.subscribe(this.player);

        this.textChannel = textChannel;

        this.client = client;
        client.on('messageCreate', this.messageCallback.bind(this));

        this.textChannel.send('the game is starting!');
        this.startSong();
    }

    messageCallback (msg: Message) {
        if (!(msg.channel instanceof DMChannel) || msg.author.bot) return;

        if (this.state === GameState.Guessing && msg.content.length <= 75) {
            if (!this.players.get(msg.author.id)) {
                this.players.set(msg.author.id, {
                    name: msg.author.username,
                    id: msg.author.id,
                    score: 0,
                    guess: '',
                    correct: false
                });
            }

            const player = this.players.get(msg.author.id);
            player!.guess = msg.content.toLowerCase();
            console.debug('guess dm recieved');
            msg.react('🗳️');

            return;
        }
    }

    getScores (guessFormat: boolean) {
        let scorestr = '';
        this.players.sort((a, b) => {
            return b.score - a.score;
        });
        this.players.forEach((player) => {
            scorestr += `${player.name}: ${player.score}${guessFormat ? ` ${player.correct ? '✅ ' : ''}${player.guess ? `\`${cleanFormatting(player.guess)}\`` : ''}` : ''}\n`;
        });
        scorestr = scorestr.substring(0, 4095);
        return scorestr;
    }

    async startSong () {
        console.debug('start song');
        const embed = new MessageEmbed()
            .setColor(0xfd6b5f);

        console.debug('past new thing');

        if (this.remainingSongs === 0) {
            const scorestr = this.getScores(false);
            embed.setTitle(`the game is over, thanks for playing!`)
                .setDescription(scorestr);
            if (this.client.autoRestartGame) {
                embed.setFooter({
                    text: 'starting again in 10 seconds...'
                });
            }
            this.textChannel.send({ embeds: [embed] });

            const winners = [...this.players.filter((player) => {
                return player.score >= [...this.players][0][1].score && player.score > 0;
            })];
            for (const value of winners) {
                const player = value[1];

                const playerRates = await Scores.findOrCreate({ where: {
                    user_id: player.id
                } });

                playerRates[0].set({
                    wins: playerRates[0].getDataValue('wins')+1,
                })
                playerRates[0].save();
            }

            this.endGame();
            return;
        }

        this.currentSong = SONGS.random();
        this.remainingSongs--;
        console.debug(this.currentSong, __dirname + '/../audio/'+ this.currentSong!.file);

        const ffmpeg = new FFmpeg({
            args: ['-ss', `${Math.floor(Math.random()*(this.currentSong!.length-30))}`, '-t', '30', '-i', __dirname + '/../audio/'+ this.currentSong!.file, ...FFMPEG_OPUS_ARGUMENTS]
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
        
        embed.setTitle(`guess the new song, use /guess or DM me your answer!`)
            .setFooter({
                text: `${20-this.remainingSongs}/20`
            });
        this.textChannel.send({ embeds: [embed] });
    }

    async revealSong () {
        this.state = GameState.Revealing;
        this.client.user?.setActivity({
            name: 'reveal phase!'
        });

        for (const value of [...this.players]) {
            const player = value[1];

            if (this.currentSong?.names.includes(player.guess)) player.correct = true;

            if (player.correct) {
                player.score++;
            }

            const playerRates = await Scores.findOrCreate({ where: {
                user_id: player.id
            } });

            const guessRates: SongGuessRates = JSON.parse(playerRates[0].getDataValue('guess_rates'));
            if (!guessRates[this.currentSong!.names[0]]) guessRates[this.currentSong!.names[0]] = {appeared:0,correct:0};
            guessRates[this.currentSong!.names[0]].appeared++;
            guessRates[this.currentSong!.names[0]].correct += player.correct ? 1 : 0;
            playerRates[0].set({
                guess_rates: JSON.stringify(guessRates)
            });
            playerRates[0].save();
        }
        const scorestr = this.getScores(true);
        this.players.forEach((player) => {
            player.guess = '';
            player.correct = false;
        });

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

        if (this.client.autoRestartGame) {
            setTimeout(this.client.startGame.bind(this.client), 10_000);
        }
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