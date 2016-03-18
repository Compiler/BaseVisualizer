package com.guod.audio;

import java.io.BufferedInputStream;
import java.io.FileInputStream;
import java.io.InputStream;

import ddf.minim.AudioPlayer;
import ddf.minim.Minim;
import ddf.minim.analysis.BeatDetect;

public class MinimWrapper
{
	private Minim		minim;
	private AudioPlayer	song;
	private BeatDetect	beat;

	public MinimWrapper(String fileName)
	{
		minim = new Minim(this);
		song = minim.loadFile(fileName);

		beat = new BeatDetect();
		beat.setSensitivity(8);
	}

	public String sketchPath(String fileName)
	{
		return fileName;
	}

	public InputStream createInput(String fileName)
	{
		try
		{
			InputStream stream = new FileInputStream(fileName);
			BufferedInputStream bufferedStream = new BufferedInputStream(stream);

			return bufferedStream;
		}
		catch (Exception e)
		{
			e.printStackTrace();
		}

		return null;
	}

	public boolean detect()
	{
		beat.detect(song.mix);
		if (beat.isOnset())
		{
			System.out.println("bass");
			return true;
		}
		return false;
	}

	public int detectSize()
	{
		return beat.dectectSize();
	}

	public void playSong()
	{
		song.play();
	}

	public AudioPlayer getSong()
	{
		return song;
	}
}