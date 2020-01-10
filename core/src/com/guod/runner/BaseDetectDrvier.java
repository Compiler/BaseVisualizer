package com.guod.runner;

import java.awt.Color;

import com.badlogic.gdx.ApplicationAdapter;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.physics.box2d.World;
import com.badlogic.gdx.utils.TimeUtils;
import com.guod.audio.MinimFactory;
import com.guod.audio.MinimWrapper;

import box2dLight.PointLight;
import box2dLight.RayHandler;

/**
 * File: BaseDetectDriver.java Last Updated: 3/18/2016 - Purpose: - Render and
 * visualize the base detection of music
 * 
 * @author Douglas Rudolph
 */
public class BaseDetectDrvier extends ApplicationAdapter {

	private OrthographicCamera camera;

	private World lightWorld;
	private RayHandler lightHandler;

	private MinimWrapper baseDetector;

	private PointLight light;

	@Override
	public void create() {
		camera = new OrthographicCamera(Gdx.graphics.getWidth(), Gdx.graphics.getHeight());
		lightWorld = new World(new Vector2(0, 0), false);
		lightHandler = new RayHandler(lightWorld);
		light = new PointLight(lightHandler, 100, Color.CYAN, 2, 0, 0);

		// song title to detect goes there
		baseDetector = new MinimWrapper("C:/Users/Douglas/Desktop/King_Krule_Easy_Easy.mp3");
		MinimFactory.playSong(baseDetector.getSong(), 25);
	}

	private float lightSize = 2.5f;
	private static long startTime = TimeUtils.millis();
	private static long elaspedTime;

	@Override
	public void render() {
		// clearing buffer
		Gdx.gl20.glClearColor(0, 0, 0, 0);
		Gdx.gl20.glClear(GL30.GL_COLOR_BUFFER_BIT | GL30.GL_DEPTH_BUFFER_BIT | GL30.GL_STENCIL_BUFFER_BIT);

		// update camera, stage
		lightWorld.step(1 / 60f, 6, 2);
		lightHandler.updateAndRender();

		if (baseDetector.detect()) {
			lightSize = 2f;
			startTime = TimeUtils.millis();
		}

		
		// if the time is greater than 1/300 of a second, shrink the light and render it
		// to the screen.
		if (TimeUtils.timeSinceMillis(startTime) - elapsedTime > 30) {
			lightSize -= .02f;
			light.setDistance(lightSize);
			startTime = TimeUtils.millis();
		}
		// calcualte elapsed time
		elaspedTime = TimeUtils.timeSinceMillis(startTime);

	}
}
