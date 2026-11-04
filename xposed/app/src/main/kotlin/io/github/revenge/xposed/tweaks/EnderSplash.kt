package io.github.revenge.xposed.tweaks

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.Shader
import android.graphics.Typeface
import android.view.View
import android.view.ViewGroup
import io.github.revenge.xposed.api.registerNativeMethod
import io.github.revenge.xposed.tweak
import java.lang.ref.WeakReference
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin
import kotlin.random.Random

private var splashRef = WeakReference<View>(null)

private fun hideSplash() {
    val view = splashRef.get() ?: return
    splashRef = WeakReference(null)
    view.post {
        view.animate().alpha(0f).setDuration(350).withEndAction {
            (view.parent as? ViewGroup)?.removeView(view)
        }.start()
    }
}

/**
 * Covers Discord's startup screen with EnderCord's particle ring, the same one as on desktop.
 * The bundle calls `endercord.splash.hide` once EnderCord is ready; it also goes away on its own as a fallback.
 */
val enderSplash by tweak {
    registerNativeMethod("endercord.splash.hide") {
        hideSplash()
        null
    }

    withAppActivity { activity ->
        activity.runOnUiThread {
            val decor = activity.window?.decorView as? ViewGroup ?: return@runOnUiThread
            val view = EnderSplashView(activity)
            decor.addView(view, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
            splashRef = WeakReference(view)
            view.postDelayed(::hideSplash, 20_000)
        }
    }
}

private class Particle(
    val angle: Float,
    val core: Boolean,
    val offset: Float,
    val size: Float,
    val speed: Float,
    val phase: Float,
)

private class EnderSplashView(context: Context) : View(context) {
    private val density = resources.displayMetrics.density
    private val start = System.currentTimeMillis()
    private val dot = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.WHITE }
    private val background = Paint()
    private val title = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        textAlign = Paint.Align.CENTER
        textSize = 11 * density
        letterSpacing = 0.5f
        typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
    }

    private fun gauss() = (Random.nextFloat() + Random.nextFloat() + Random.nextFloat() - 1.5f) / 1.5f

    // A crisp core line plus drifting dust, denser on one side, like the desktop splash
    private val particles = List(1400) { i ->
        val core = i % 3 == 0
        val angle = Random.nextFloat() * 2 * PI.toFloat()
        val dust = 0.5f + 0.5f * sin(angle + 1.2f)
        Particle(
            angle = angle,
            core = core,
            offset = if (core) gauss() * 1.2f
            else abs(gauss()) * (3 + 22 * dust) * (if (Random.nextBoolean()) -0.6f else 1f),
            size = if (core) 1.1f else 0.5f + Random.nextFloat() * 0.8f,
            speed = 0.7f + Random.nextFloat() * 0.6f,
            phase = Random.nextFloat() * 6.28f,
        )
    }

    init {
        // Swallow touches so nothing underneath reacts while the splash is up
        isClickable = true
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        background.shader = RadialGradient(
            w / 2f, h / 2f, max(w, h) * 0.7f,
            Color.rgb(19, 20, 22), Color.rgb(6, 6, 7), Shader.TileMode.CLAMP,
        )
    }

    override fun onDraw(canvas: Canvas) {
        val t = (System.currentTimeMillis() - start).toFloat()
        val w = width.toFloat()
        val h = height.toFloat()
        canvas.drawRect(0f, 0f, w, h, background)

        val cx = w / 2
        val cy = h / 2
        val radius = min(w, h) * 0.3f
        val sweep = t * 0.0005f
        val fadeIn = min(1f, t / 1000f)

        for (p in particles) {
            val angle = p.angle + t * 0.00012f * p.speed
            val r = radius + (p.offset + sin(t * 0.001f + p.phase) * (if (p.core) 0.3f else 1.5f)) * density
            val light = (0.5f + 0.5f * cos(angle - sweep)).pow(if (p.core) 8 else 3)
            val fade = if (p.core) 1f else max(0f, 1 - abs(p.offset) / 26)
            val alpha = (if (p.core) 0.06f + light else (0.04f + 0.6f * light) * fade) *
                (0.85f + 0.15f * sin(t * 0.004f + p.phase)) * fadeIn
            dot.alpha = (min(1f, alpha) * 255).toInt()
            val x = cx + cos(angle) * r
            val y = cy + sin(angle) * r
            val s = p.size * density
            canvas.drawRect(x, y, x + s, y + s, dot)
        }

        title.alpha = (fadeIn * 255).toInt()
        canvas.drawText("ENDERCORD", cx, cy + title.textSize / 3, title)

        postInvalidateOnAnimation()
    }
}
