package com.guod.audio;

import ddf.minim.AudioPlayer;
import ddf.minim.analysis.BeatDetect;

public class MinimFactory 
{
	/**
	 * Detects bass note hits in the current song that is being played 
	 * 
	 * @param song
	 * @return true if a note is detected: false otherwise
	 */
	public static boolean detectBeat(AudioPlayer song)
	{	
		BeatDetect beat = new BeatDetect();
		
		beat.detect(song.mix);
		if(beat.isOnset())
		{
			System.out.println("bass");
			return true;
		}
		return false;
	}
	
	/**
	 * Plays a song from the beginning 
	 * @param song
	 */
	public static void playSong(AudioPlayer song)
	{
		song.play();
	}
	
	/**
	 * - Is called when an audio file is played
	 * - The song being played starts at "secondsIntoSong" * 1000 
	 * - NOTE: its multiplied by 1000 due to time being measured in nano time
	 * @param song
	 * @param time
	 */
	public static void playSong(AudioPlayer song, int secondsIntoSong)
	{
		song.play(secondsIntoSong*1000);
		
	}
	
}
