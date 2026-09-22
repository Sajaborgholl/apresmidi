"use client";

import { useEffect, useRef } from "react";

// Scroll-scrubbed envelope hero. The video never plays — its currentTime is
// driven straight off the section's scroll progress, so scrolling down runs
// the envelope open and scrolling up reseals it. Deliberately dependency-free
// (one passive scroll listener + rAF), matching the rest of this page:
// HowItWorks is pure CSS sticky, Reveal is a bare IntersectionObserver. No
// scroll library for one section.
//
// This has to be the first thing in the document flow for the scrub to start
// on the first pixel of scroll — progress is measured from the section's top
// edge, so anything above it is dead scroll. The homepage nav is `position:
// fixed` (see .site-nav in globals.css) partly for that reason; making it
// sticky again would put its height back in front of progress 0.

const VIDEO_SRC = "/videos/envelope-sequence.mp4";
const POSTER_SRC = "/videos/envelope-poster.jpg";

// envelope-sequence.mp4 is encoded FOR SEEKING, not for playback: every frame
// is a keyframe (all-intra, x264 -g 1 -bf 0), constant 30fps, faststart. That
// is the whole reason the scrub keeps up. A stock export — the CapCut original
// here had a 30-frame GOP — makes each seek decode up to 29 predicted frames
// first, which measured ~3x slower on average and ~4x worse at the 90th
// percentile, and reads as the picture lagging the scroll and skipping ahead.
// If this clip is ever re-cut, re-encode it the same way:
//
//   ffmpeg -i in.mp4 -an -vf fps=30,format=yuv420p -c:v libx264 -preset slow //     -crf 22 -g 1 -keyint_min 1 -sc_threshold 0 -bf 0 -movflags +faststart out.mp4
//
// All-intra costs size at a given quality, so it is also why the clip is kept
// short and 720p. Lower -crf for more fidelity, raise it for a smaller file:
// the whole file is downloaded before the scrub goes live, so size is latency.
//
// 1280x720, 8.033s, 241 frames. Progress 0 maps to
// VIDEO_START_TIME, progress 1 to the last frame. This clip opens straight
// onto the envelope with no dead lead-in, so nothing is trimmed — raise this
// to skip time off the front (it is a scrub offset, the file is untouched).
const VIDEO_START_TIME = 0;

// Where the beats land in scroll progress, measured off the file. Nothing
// reads these — the scrub is linear across the whole span — so they're here as
// the map for retuning VIDEO_START_TIME or --envelope-scroll-height in
// globals.css (that height is what sets scrub speed: less of it means the clip
// runs past in less scroll):
//
//   0.000 - 0.160   sealed, drifting over the water
//   0.160 - 0.360   envelope flips, edge-on at ~0.27
//   0.360 - 0.500   flap opens
//   0.500 - 1.000   the invitation slides out and settles

// Where the reduced-motion / no-JS fallback parks the video: well inside the
// open-and-still phase, so the still frame reads as an opened envelope.
const STATIC_FRAME_PROGRESS = 0.8;

// Half a frame at 30fps. Seeks are the expensive part of scrubbing, so skip
// any tick that wouldn't land on a different frame anyway.
const SEEK_EPSILON = 1 / 60;

// How long a seek may sit unacknowledged before the in-flight slot is freed.
// Long enough not to fire during an ordinary decode, short enough that a
// dropped completion event does not strand the scrub for a visible beat.
const SEEK_WATCHDOG_MS = 400;

// The static layout, as the two --envelope-* switches globals.css defines.
// This is the no-JS fallback; the prefers-reduced-motion copy of it lives in
// globals.css, and the two must stay in sync.
const STATIC_LAYOUT_CSS =
  ".envelope-hero{--envelope-height:100svh;--envelope-stage-position:static}";

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

export default function EnvelopeScrollHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const video = videoRef.current;
    if (!section || !stage || !video) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Maps scroll progress onto the playable span of the file.
    const timeAt = (p: number) =>
      VIDEO_START_TIME + p * Math.max(0, video.duration - VIDEO_START_TIME);

    // offsetHeight is the expensive read (it forces layout), so both are
    // cached. A ResizeObserver — not just the debounced resize handler below —
    // is what keeps them honest: it fires immediately on observe and on every
    // real box change, so a cache can't be seeded from a mid-layout
    // measurement and then stay wrong forever.
    //
    // A sticky element travels its section's height minus its own, so the
    // stage is measured rather than letting window.innerHeight stand in for
    // it. Those are three different numbers: the section is sized in vh, the
    // stage in svh, and innerHeight tracks the live viewport. On mobile, where
    // a collapsing toolbar moves innerHeight but not vh, the mismatch made
    // progress drift and stop the scrub short of the last frame.
    let sectionHeight = 0;
    let stageHeight = 0;
    const measure = () => {
      sectionHeight = section.offsetHeight;
      stageHeight = stage.offsetHeight;
    };
    const scrollRange = () => Math.max(1, sectionHeight - stageHeight);

    // Seeks are serialised: at most one in flight, and only the newest target
    // is kept. Assigning currentTime every frame instead re-targets a seek that
    // hasn't finished, so under a fast scroll the decoder keeps abandoning work
    // and the picture lurches between whatever few positions it landed on.
    //
    // A seek is "in flight" until its frame is actually on screen, which is
    // what requestVideoFrameCallback reports; `seeked` fires a beat earlier,
    // when the decoder reached the target but the compositor has not shown it.
    // Firefox has no rVFC, so `seeked` stays the fallback there. Either way a
    // watchdog also frees the slot: an aborted or errored seek fires neither
    // event, and nothing else clears the flag, so without it one dropped
    // completion would freeze the scrub permanently.
    let seekTarget: number | null = null;
    let seekInFlight = false;
    let watchdog: number | undefined;
    let frameHandle: number | undefined;
    let seekGen = 0;

    const useRvfc = typeof video.requestVideoFrameCallback === "function";

    const disarm = () => {
      window.clearTimeout(watchdog);
      watchdog = undefined;
      if (frameHandle !== undefined) {
        video.cancelVideoFrameCallback(frameHandle);
        frameHandle = undefined;
      }
    };

    // settle is the hoisted one of this mutually recursive pair, so that
    // flushSeek can stay an arrow: TypeScript drops the outer null-narrowing of
    // `video` inside a function declaration (it could be called before the
    // guard ran), and flushSeek is the half that touches it.
    // gen is the seek a completion belongs to. Several signals can report the
    // same seek, and `seeked` is a persistent listener that can arrive a seek
    // late — unguarded, that stale call would disarm the seek now in flight and
    // drop its frame.
    function settle(gen: number) {
      if (gen !== seekGen) return;
      disarm();
      seekInFlight = false;
      flushSeek();
    }

    const flushSeek = () => {
      if (seekTarget === null) {
        seekInFlight = false;
        return;
      }
      const t = seekTarget;
      seekTarget = null;
      if (Math.abs(video.currentTime - t) <= SEEK_EPSILON) {
        seekInFlight = false;
        return;
      }
      disarm();
      const gen = ++seekGen;
      seekInFlight = true;
      video.currentTime = t;
      if (useRvfc) frameHandle = video.requestVideoFrameCallback(() => settle(gen));
      watchdog = window.setTimeout(() => settle(gen), SEEK_WATCHDOG_MS);
    };

    // Whichever completion arrives first wins. rVFC is the accurate one, but
    // Safari has not reliably fired it for a *paused* element, and this video
    // is never played — so `seeked` stays armed everywhere instead of only
    // standing in where rVFC is missing. Trusting rVFC alone would mean that,
    // wherever it stays silent, only the watchdog frees the slot and the scrub
    // crawls at one frame per SEEK_WATCHDOG_MS.
    const onSeeked = () => settle(seekGen);
    video.addEventListener("seeked", onSeeked);

    const render = (p: number) => {
      if (video.readyState < 2 || !Number.isFinite(video.duration)) return;
      seekTarget = timeAt(p);
      if (!seekInFlight) flushSeek();
    };

    // --- reduced motion: one still frame, no scrubbing, no listeners ------
    const showStaticFrame = () => {
      const park = () => {
        if (Number.isFinite(video.duration)) {
          video.currentTime = timeAt(STATIC_FRAME_PROGRESS);
        }
      };
      if (video.readyState >= 1) park();
      else video.addEventListener("loadedmetadata", park, { once: true });
    };

    // --- scrub mode -------------------------------------------------------
    let ticking = false;
    let resizeTimer: number | undefined;
    let bound = false;
    let observer: ResizeObserver | undefined;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        render(clamp01(-section.getBoundingClientRect().top / scrollRange()));
      });
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        measure();
        onScroll();
      }, 150);
    };

    // iOS Safari will not paint a frame for a <video> that has never played:
    // currentTime writes are accepted and readyState climbs, but the element
    // goes on showing the poster, so the section looks like a still image that
    // ignores scrolling. One muted play()/pause() unlocks decoding for the rest
    // of the page. It only counts inside a real user gesture — called on load
    // it is rejected — so it is armed on the first touch, and re-renders
    // afterwards because play() moves currentTime off the scrubbed frame.
    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      const done = () => {
        video.pause();
        onScroll();
      };
      const started = video.play();
      if (started && typeof started.then === "function") started.then(done).catch(() => {});
      else done();
    };

    const bindScrub = () => {
      if (bound) return;
      bound = true;
      measure();
      onScroll();
      window.addEventListener("touchstart", unlock, { passive: true, once: true });
      window.addEventListener("pointerdown", unlock, { passive: true, once: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize);
      window.addEventListener("orientationchange", onResize);
      observer = new ResizeObserver(() => {
        measure();
        onScroll();
      });
      observer.observe(section);
      observer.observe(stage);
    };

    const unbindScrub = () => {
      if (!bound) return;
      bound = false;
      window.clearTimeout(resizeTimer);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      observer?.disconnect();
      observer = undefined;
    };

    // Scroll is only wired up once there's a decoded frame to seek within —
    // before that, currentTime writes are dropped and the poster is what's
    // on screen.
    const onLoadedData = () => bindScrub();

    // The source is attached here rather than in the markup, because the two
    // modes want it delivered differently — and attaching it in both places
    // downloads the file twice, which starves the element that actually needs
    // it. Until one of these runs, the <video> has no src and the poster is
    // what's on screen, which is also what a no-JS visitor keeps.
    const controller = new AbortController();
    let objectUrl: string | null = null;
    let sourceStarted = false;

    // A paused video that never plays stops downloading once it has buffered
    // enough for readyState 4 — measured on this clip, roughly the first 1.3s
    // plus the tail, and it does not grow while the video sits there. Every
    // seek into the unbuffered middle is then a range request, far slower than
    // frames are asked for, so scrolling lurches and lands wherever it stopped.
    // Fetching the file once and seeking inside an in-memory copy makes every
    // seek a pure decode.
    const attachBufferedSource = async () => {
      if (sourceStarted) return;
      sourceStarted = true;
      try {
        const response = await fetch(VIDEO_SRC, { signal: controller.signal });
        if (!response.ok) throw new Error(String(response.status));
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        video.src = objectUrl;
      } catch {
        if (controller.signal.aborted) return;
        // Offline, blocked, or a failed fetch — stream it instead. Scrubbing
        // will be coarse, but the section still works.
        video.src = VIDEO_SRC;
      }
    };

    const attachStreamingSource = () => {
      if (sourceStarted) return;
      sourceStarted = true;
      video.src = VIDEO_SRC;
    };

    const applyMode = () => {
      if (reduceMotion.matches) {
        unbindScrub();
        video.removeEventListener("loadeddata", onLoadedData);
        // One still frame needs one range request, not the whole file.
        attachStreamingSource();
        showStaticFrame();
        return;
      }
      video.addEventListener("loadeddata", onLoadedData);
      if (video.readyState >= 2) bindScrub();
      void attachBufferedSource();
    };

    applyMode();
    reduceMotion.addEventListener("change", applyMode);

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reduceMotion.removeEventListener("change", applyMode);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("seeked", onSeeked);
      disarm();
      unbindScrub();
    };
  }, []);

  return (
    <>
      <section ref={sectionRef} className="envelope-hero" aria-label="Your invitation, opening">
        <div ref={stageRef} className="envelope-stage">
          <video
            ref={videoRef}
            className="envelope-video"
            poster={POSTER_SRC}
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
      </section>

      {/* The scroll layout is the CSS default and reduced motion opts out of
          it via media query, which leaves only the no-JS case: without the
          scrub there's nothing to drive all that scroll, so fall back to the
          same static layout. Done as <noscript><style> rather than a pre-paint
          script writing an attribute — React owns both <html> and this
          section, so any such write is a hydration mismatch. */}
      <noscript dangerouslySetInnerHTML={{ __html: `<style>${STATIC_LAYOUT_CSS}</style>` }} />
    </>
  );
}
